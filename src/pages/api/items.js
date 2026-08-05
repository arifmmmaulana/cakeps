import { supabase, getAuthClient } from '../../lib/supabase';

export const prerender = false;

// GET: Ambil semua barang belanjaan aktif
export async function GET({ request }) {
  try {
    const { data, error } = await getAuthClient(request)
      .from('items')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Convert snake_case back to camelCase for frontend components
    const items = data.map(item => ({
      id: item.id,
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      estimatedPrice: item.estimated_price,
      actualPrice: item.actual_price,
      checked: item.checked ? 1 : 0,
      createdAt: item.created_at
    }));

    return new Response(JSON.stringify(items), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

// POST: Tambahkan barang belanjaan baru
export async function POST({ request }) {
  try {
    const body = await request.json();
    const { name, category, quantity, unit, estimatedPrice } = body;

    if (!name || !category) {
      return new Response(JSON.stringify({ error: 'Nama dan kategori wajib diisi.' }), { status: 400 });
    }

    const { data, error } = await getAuthClient(request)
      .from('items')
      .insert({
        name,
        category,
        quantity: parseFloat(quantity) || 1,
        unit: unit || 'pcs',
        estimated_price: parseInt(estimatedPrice) || 0,
        actual_price: 0,
        checked: false
      })
      .select()
      .single();

    if (error) throw error;

    const newItem = {
      id: data.id,
      name: data.name,
      category: data.category,
      quantity: data.quantity,
      unit: data.unit,
      estimatedPrice: data.estimated_price,
      actualPrice: data.actual_price,
      checked: data.checked ? 1 : 0,
      createdAt: data.created_at
    };

    return new Response(JSON.stringify(newItem), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

// PUT: Perbarui barang belanjaan
export async function PUT({ request }) {
  try {
    const body = await request.json();
    const { id, name, category, quantity, unit, estimatedPrice, actualPrice, checked } = body;

    if (!id) {
      return new Response(JSON.stringify({ error: 'ID barang wajib disertakan.' }), { status: 400 });
    }

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (category !== undefined) updates.category = category;
    if (quantity !== undefined) updates.quantity = parseFloat(quantity);
    if (unit !== undefined) updates.unit = unit;
    if (estimatedPrice !== undefined) updates.estimated_price = parseInt(estimatedPrice);
    if (actualPrice !== undefined) updates.actual_price = parseInt(actualPrice);
    if (checked !== undefined) updates.checked = checked ? true : false;

    if (Object.keys(updates).length === 0) {
      return new Response(JSON.stringify({ error: 'Tidak ada data untuk diperbarui.' }), { status: 400 });
    }

    const { data, error } = await getAuthClient(request)
      .from('items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    const updatedItem = {
      id: data.id,
      name: data.name,
      category: data.category,
      quantity: data.quantity,
      unit: data.unit,
      estimatedPrice: data.estimated_price,
      actualPrice: data.actual_price,
      checked: data.checked ? 1 : 0,
      createdAt: data.created_at
    };

    return new Response(JSON.stringify(updatedItem), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

// DELETE: Hapus barang
export async function DELETE({ request, url }) {
  try {
    const id = url.searchParams.get('id');
    const clearChecked = url.searchParams.get('clearChecked') === 'true';
    const clearAll = url.searchParams.get('clearAll') === 'true';

    if (clearAll) {
      // Supabase requires a filter for delete. We can delete all items where id > 0
      const { error } = await getAuthClient(request).from('items').delete().gt('id', 0);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, message: 'Semua barang berhasil dihapus.' }), { status: 200 });
    }

    if (clearChecked) {
      const { error } = await getAuthClient(request).from('items').delete().eq('checked', true);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, message: 'Barang selesai dibersihkan.' }), { status: 200 });
    }

    if (!id) {
      return new Response(JSON.stringify({ error: 'ID wajib disertakan untuk penghapusan tunggal.' }), { status: 400 });
    }

    const { error } = await getAuthClient(request).from('items').delete().eq('id', id);
    if (error) throw error;
    
    return new Response(JSON.stringify({ success: true, message: `Barang dengan ID ${id} berhasil dihapus.` }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
