import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const USER_ID = 'ty';

// ── daily log ──────────────────────────────────────────────────
export async function loadDailyLog() {
  const { data, error } = await supabase
    .from('daily_log')
    .select('*')
    .eq('user_id', USER_ID);
  if (error) { console.error('loadDailyLog', error); return {}; }
  return data.reduce((acc, row) => {
    acc[row.date] = {
      weight: row.weight,
      training: row.training,
      activities: row.activities || {},
      meals: row.meals || {},
    };
    return acc;
  }, {});
}

export async function saveDayEntry(date, entry) {
  const { error } = await supabase
    .from('daily_log')
    .upsert({
      user_id: USER_ID,
      date,
      weight: entry.weight || null,
      training: entry.training || null,
      activities: entry.activities || {},
      meals: entry.meals || {},
    }, { onConflict: 'user_id,date' });
  if (error) console.error('saveDayEntry', error);
}

// ── weekly checkins ────────────────────────────────────────────
export async function loadCheckins() {
  const { data, error } = await supabase
    .from('weekly_checkins')
    .select('*')
    .eq('user_id', USER_ID);
  if (error) { console.error('loadCheckins', error); return {}; }
  return data.reduce((acc, row) => {
    acc[row.week] = row.data;
    return acc;
  }, {});
}

export async function saveCheckin(week, data) {
  const { error } = await supabase
    .from('weekly_checkins')
    .upsert({
      user_id: USER_ID,
      week,
      data,
      saved_at: new Date().toISOString(),
    }, { onConflict: 'user_id,week' });
  if (error) console.error('saveCheckin', error);
}

// ── food library ───────────────────────────────────────────────
export async function loadLibrary(seedFoods) {
  const { data, error } = await supabase
    .from('food_library')
    .select('*')
    .eq('user_id', USER_ID)
    .single();
  if (error || !data) return seedFoods;
  return data.foods || seedFoods;
}

export async function saveLibrary(foods) {
  const { error } = await supabase
    .from('food_library')
    .upsert({
      user_id: USER_ID,
      foods,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
  if (error) console.error('saveLibrary', error);
}
