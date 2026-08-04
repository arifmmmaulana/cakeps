import { supabase } from '../../lib/supabase';

export const prerender = false;

// GET: Ambil semua riwayat belanja
export async function GET() {
  try {
    const { data: histories, error } = await supabase
      .from('history')
      .select('*, items:history_items(*)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Map snake_case to camelCase
    const formattedHistories = histories.map(h => ({
      id: h.id,
      createdAt: h.created_at,
      totalActualPrice: h.total_actual_price,
      totalEstimatedPrice: h.total_estimated_price,
      totalItems: h.total_items,
      items: (h.items || []).map(item => ({
        id: item.id,
        historyId: item.history_id,
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        unit: item.unit,
        estimatedPrice: item.estimated_price,
        actualPrice: item.actual_price
      }))
    }));

    return new Response(JSON.stringify(formattedHistories), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

// POST: Simpan daftar belanja aktif ke dalam riwayat
export async function POST({ request }) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'save_current') {
      // 1. Ambil semua barang aktif
      const { data: activeItems, error: activeError } = await supabase.from('items').select('*');
      if (activeError) throw activeError;
      
      if (!activeItems || activeItems.length === 0) {
        return new Response(
          JSON.stringify({ error: 'Daftar belanja aktif kosong, tidak ada yang bisa disimpan ke riwayat.' }),
          { status: 400 }
        );
      }

      // 2. Hitung statistik
      const totalItems = activeItems.length;
      const totalEstimated = activeItems.reduce((sum, item) => sum + (item.estimated_price * item.quantity), 0);
      const totalActual = activeItems.reduce((sum, item) => {
        const price = item.actual_price > 0 ? item.actual_price : (item.estimated_price * item.quantity);
        return sum + price;
      }, 0);

      // 3. Insert History Header
      const { data: newHistory, error: insertError } = await supabase
        .from('history')
        .insert({
          total_actual_price: totalActual,
          total_estimated_price: totalEstimated,
          total_items: totalItems
        })
        .select()
        .single();
        
      if (insertError) throw insertError;

      // 4. Siapkan data items untuk history_items
      const historyItemsData = activeItems.map(item => ({
        history_id: newHistory.id,
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        unit: item.unit,
        estimated_price: item.estimated_price,
        actual_price: item.actual_price
      }));

      // 5. Insert History Items
      const { error: itemsError } = await supabase
        .from('history_items')
        .insert(historyItemsData);
        
      if (itemsError) throw itemsError;

      // 6. Hapus semua data dari items aktif (kosongkan keranjang)
      const { error: deleteError } = await supabase.from('items').delete().gt('id', 0);
      if (deleteError) throw deleteError;

      return new Response(JSON.stringify({ success: true, history: { id: newHistory.id } }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Action tidak valid.' }), { status: 400 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

// DELETE: Hapus riwayat spesifik
export async function DELETE({ url }) {
  try {
    const id = url.searchParams.get('id');
    if (!id) {
      return new Response(JSON.stringify({ error: 'ID riwayat wajib disertakan.' }), { status: 400 });
    }

    // Cascade delete automatically removes history_items in PostgreSQL
    const { error } = await supabase.from('history').delete().eq('id', id);
    if (error) throw error;

    return new Response(JSON.stringify({ success: true, message: 'Riwayat berhasil dihapus.' }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
