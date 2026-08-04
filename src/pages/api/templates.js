import { supabase } from '../../lib/supabase';

export const prerender = false;

// GET: Ambil semua template belanjaan dan item-itemnya
export async function GET() {
  try {
    // Supabase can query relational data directly
    const { data: templates, error } = await supabase
      .from('templates')
      .select('*, items:template_items(*)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Map snake_case to camelCase for frontend components
    const formattedTemplates = templates.map(t => ({
      id: t.id,
      name: t.name,
      createdAt: t.created_at,
      items: (t.items || []).map(item => ({
        id: item.id,
        templateId: item.template_id,
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        unit: item.unit,
        estimatedPrice: item.estimated_price
      }))
    }));

    return new Response(JSON.stringify(formattedTemplates), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

// POST: Menyimpan template baru atau memuat template ke daftar aktif
export async function POST({ request }) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'save') {
      const { name } = body;
      if (!name) {
        return new Response(JSON.stringify({ error: 'Nama template wajib diisi.' }), { status: 400 });
      }

      // Ambil semua barang dari daftar belanja aktif saat ini
      const { data: activeItems, error: activeError } = await supabase.from('items').select('*');
      if (activeError) throw activeError;
      
      if (!activeItems || activeItems.length === 0) {
        return new Response(
          JSON.stringify({ error: 'Daftar belanja aktif kosong. Tambahkan barang terlebih dahulu sebelum disimpan sebagai template.' }),
          { status: 400 }
        );
      }

      // 1. Buat Header Template
      const { data: newTemplate, error: insertError } = await supabase
        .from('templates')
        .insert({ name })
        .select()
        .single();
        
      if (insertError) throw insertError;

      // 2. Siapkan data items untuk dimasukkan ke template_items
      const templateItemsData = activeItems.map(item => ({
        template_id: newTemplate.id,
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        unit: item.unit,
        estimated_price: item.estimated_price
      }));

      // 3. Masukkan semua item secara batch
      const { error: itemsError } = await supabase
        .from('template_items')
        .insert(templateItemsData);
        
      if (itemsError) throw itemsError;

      return new Response(JSON.stringify({ success: true, template: { id: newTemplate.id, name: newTemplate.name } }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (action === 'load') {
      const { templateId, mode = 'overwrite' } = body; // mode: 'overwrite' atau 'append'
      if (!templateId) {
        return new Response(JSON.stringify({ error: 'ID template wajib disertakan.' }), { status: 400 });
      }

      // Ambil item dari template
      const { data: templateItems, error: fetchError } = await supabase
        .from('template_items')
        .select('*')
        .eq('template_id', templateId);
        
      if (fetchError) throw fetchError;

      if (mode === 'overwrite') {
        // Kosongkan daftar aktif
        await supabase.from('items').delete().gt('id', 0);
      }

      if (templateItems && templateItems.length > 0) {
        const newActiveItems = templateItems.map(item => ({
          name: item.name,
          category: item.category,
          quantity: item.quantity,
          unit: item.unit,
          estimated_price: item.estimated_price,
          actual_price: 0,
          checked: false
        }));

        const { error: insertError } = await supabase
          .from('items')
          .insert(newActiveItems);
          
        if (insertError) throw insertError;
      }

      return new Response(JSON.stringify({ success: true, message: `Berhasil memuat template.` }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (action === 'create_from_history') {
      const { historyId, name } = body;
      if (!historyId || !name) {
        return new Response(JSON.stringify({ error: 'ID Riwayat dan nama template wajib diisi.' }), { status: 400 });
      }

      // 1. Fetch History Items
      const { data: historyItems, error: historyError } = await supabase
        .from('history_items')
        .select('*')
        .eq('history_id', historyId);
      
      if (historyError) throw historyError;
      if (!historyItems || historyItems.length === 0) {
         return new Response(JSON.stringify({ error: 'Riwayat belanja kosong.' }), { status: 400 });
      }

      // 2. Create Template
      const { data: newTemplate, error: insertError } = await supabase
        .from('templates')
        .insert({ name })
        .select()
        .single();
      if (insertError) throw insertError;

      // 3. Prepare and Insert Template Items
      const templateItemsData = historyItems.map(item => ({
        template_id: newTemplate.id,
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        unit: item.unit,
        estimated_price: item.estimated_price
      }));

      const { error: itemsError } = await supabase.from('template_items').insert(templateItemsData);
      if (itemsError) throw itemsError;

      return new Response(JSON.stringify({ success: true, message: `Berhasil menyimpan sebagai template "${name}".` }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Action tidak valid. Harus "save" atau "load".' }), { status: 400 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

// DELETE: Hapus template belanjaan
export async function DELETE({ url }) {
  try {
    const id = url.searchParams.get('id');
    if (!id) {
      return new Response(JSON.stringify({ error: 'ID template wajib disertakan.' }), { status: 400 });
    }

    // Cascade delete akan berjalan secara otomatis di Supabase PostgreSQL
    const { error } = await supabase.from('templates').delete().eq('id', id);
    if (error) throw error;

    return new Response(JSON.stringify({ success: true, message: 'Template berhasil dihapus.' }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
