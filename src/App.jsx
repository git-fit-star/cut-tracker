import { useState, useEffect, useRef } from "react"; // eslint-disable-line no-unused-vars
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, BarChart, Bar } from "recharts";
import { loadDailyLog, saveDayEntry, loadCheckins, saveCheckin as dbSaveCheckin, loadLibrary, saveLibrary } from "./supabase";

// ── targets ──────────────────────────────────────────────────
const START_WEIGHT = 197.5;
const GOAL_LOW  = 175;
const GOAL_HIGH = 180;
const WEEKLY_LOSS  = 1.5;
const TOTAL_WEEKS  = 12;
const CAL_TARGET     = 2600;
const PROTEIN_TARGET = 180;
const CARB_TARGET    = 220;
const FAT_TARGET     = 75;

// ── pre-seeded food library ───────────────────────────────────
const SEED_FOODS = [
  // protein shakes / supplements
  { id:"f001", cat:"Shakes",    name:"Whey Isolate (1 scoop)",      serving:"1 scoop",   cal:130, p:25, c:5,  f:1  },
  { id:"f002", cat:"Shakes",    name:"Whole Milk (8 oz)",           serving:"8 oz",      cal:150, p:8,  c:12, f:8  },
  { id:"f003", cat:"Shakes",    name:"Almond Milk unsweetened (8oz)",serving:"8 oz",     cal:40,  p:1,  c:2,  f:3  },
  // bars
  { id:"f010", cat:"Bars",      name:"RX Bar – Choc Sea Salt",      serving:"1 bar",     cal:210, p:12, c:24, f:8  },
  { id:"f011", cat:"Bars",      name:"RX Bar – Peanut Butter",      serving:"1 bar",     cal:210, p:12, c:23, f:8  },
  { id:"f012", cat:"Bars",      name:"RX Bar – Nut Butter & Oats",  serving:"1 bar",     cal:210, p:12, c:24, f:8  },
  // eggs
  { id:"f020", cat:"Eggs",      name:"Hard Boiled Egg",             serving:"1 egg",     cal:70,  p:6,  c:0,  f:5  },
  { id:"f021", cat:"Eggs",      name:"Scrambled Egg",               serving:"1 egg",     cal:90,  p:6,  c:1,  f:7  },
  // dairy / yogurt
  { id:"f030", cat:"Dairy",     name:"Fage Whole Milk Yogurt",      serving:"6 oz",      cal:130, p:11, c:8,  f:6  },
  { id:"f031", cat:"Dairy",     name:"Fage 0% Greek Yogurt",        serving:"6 oz",      cal:100, p:17, c:7,  f:0  },
  { id:"f032", cat:"Dairy",     name:"Feta Cheese",                 serving:"1 oz",      cal:75,  p:4,  c:1,  f:6  },
  { id:"f033", cat:"Dairy",     name:"Cottage Cheese",              serving:"½ cup",     cal:110, p:14, c:5,  f:3  },
  { id:"f034", cat:"Dairy",     name:"String Cheese",               serving:"1 stick",   cal:80,  p:7,  c:1,  f:5  },
  // fruit
  { id:"f040", cat:"Fruit",     name:"Banana (medium)",             serving:"1 banana",  cal:105, p:1,  c:27, f:0  },
  { id:"f041", cat:"Fruit",     name:"Mixed Berries",               serving:"½ cup",     cal:40,  p:0,  c:10, f:0  },
  { id:"f042", cat:"Fruit",     name:"Strawberries",                serving:"1 cup",     cal:50,  p:1,  c:12, f:0  },
  { id:"f043", cat:"Fruit",     name:"Frozen Grapes",               serving:"½ cup",     cal:90,  p:1,  c:23, f:0  },
  { id:"f044", cat:"Fruit",     name:"Blueberries",                 serving:"½ cup",     cal:42,  p:1,  c:11, f:0  },
  // protein
  { id:"f050", cat:"Protein",   name:"Chicken Breast",              serving:"6 oz",      cal:185, p:38, c:0,  f:4  },
  { id:"f051", cat:"Protein",   name:"Chicken Thigh",               serving:"6 oz",      cal:240, p:34, c:0,  f:12 },
  { id:"f052", cat:"Protein",   name:"Salmon",                      serving:"6 oz",      cal:280, p:40, c:0,  f:13 },
  { id:"f053", cat:"Protein",   name:"Shrimp",                      serving:"6 oz",      cal:170, p:32, c:2,  f:3  },
  { id:"f054", cat:"Protein",   name:"Tilapia",                     serving:"6 oz",      cal:155, p:32, c:0,  f:3  },
  { id:"f055", cat:"Protein",   name:"Ground Pork (lean)",          serving:"5 oz",      cal:220, p:30, c:0,  f:11 },
  { id:"f056", cat:"Protein",   name:"Ground Turkey",               serving:"5 oz",      cal:195, p:30, c:0,  f:8  },
  { id:"f057", cat:"Protein",   name:"Beef Sirloin",                serving:"5 oz",      cal:250, p:35, c:0,  f:12 },
  { id:"f058", cat:"Protein",   name:"Turkey Deli (2 slices)",      serving:"2 slices",  cal:60,  p:10, c:2,  f:1  },
  { id:"f059", cat:"Protein",   name:"Tuna (canned, drained)",      serving:"4 oz",      cal:130, p:28, c:0,  f:1  },
  // veg
  { id:"f060", cat:"Veg",       name:"Mixed Greens",                serving:"2 cups",    cal:15,  p:1,  c:2,  f:0  },
  { id:"f061", cat:"Veg",       name:"Roasted Broccoli",            serving:"1 cup",     cal:55,  p:4,  c:10, f:1  },
  { id:"f062", cat:"Veg",       name:"Roasted Asparagus",           serving:"1 cup",     cal:40,  p:3,  c:6,  f:1  },
  { id:"f063", cat:"Veg",       name:"Roasted Mixed Veg",           serving:"1 cup",     cal:70,  p:2,  c:13, f:2  },
  { id:"f064", cat:"Veg",       name:"Sautéed Spinach",             serving:"1 cup",     cal:45,  p:3,  c:5,  f:2  },
  { id:"f065", cat:"Veg",       name:"Brussels Sprouts",            serving:"1 cup",     cal:60,  p:4,  c:11, f:1  },
  { id:"f066", cat:"Veg",       name:"Zucchini + Peppers",          serving:"1 cup",     cal:40,  p:2,  c:8,  f:1  },
  { id:"f067", cat:"Veg",       name:"Cauliflower Rice",            serving:"1 cup",     cal:35,  p:2,  c:7,  f:0  },
  { id:"f068", cat:"Veg",       name:"Green Beans",                 serving:"1 cup",     cal:35,  p:2,  c:8,  f:0  },
  // starches / carbs
  { id:"f070", cat:"Starches",  name:"Brown Rice (cooked)",         serving:"½ cup",     cal:110, p:2,  c:23, f:1  },
  { id:"f071", cat:"Starches",  name:"White Rice (cooked)",         serving:"½ cup",     cal:105, p:2,  c:22, f:0  },
  { id:"f072", cat:"Starches",  name:"Quinoa (cooked)",             serving:"½ cup",     cal:111, p:4,  c:20, f:2  },
  { id:"f073", cat:"Starches",  name:"Sweet Potato (small)",        serving:"1 small",   cal:115, p:2,  c:27, f:0  },
  { id:"f074", cat:"Starches",  name:"Sourdough Bread",             serving:"1 slice",   cal:100, p:4,  c:19, f:1  },
  { id:"f075", cat:"Starches",  name:"Lentils (cooked)",            serving:"½ cup",     cal:115, p:9,  c:20, f:0  },
  { id:"f076", cat:"Starches",  name:"Rice Cake",                   serving:"1 cake",    cal:35,  p:1,  c:7,  f:0  },
  // nuts / fats
  { id:"f080", cat:"Nuts & Fats", name:"Pistachios",                serving:"1 oz",      cal:160, p:6,  c:8,  f:13 },
  { id:"f081", cat:"Nuts & Fats", name:"Almonds",                   serving:"1 oz",      cal:165, p:6,  c:6,  f:14 },
  { id:"f082", cat:"Nuts & Fats", name:"Almond Butter",             serving:"1 tbsp",    cal:100, p:3,  c:3,  f:9  },
  { id:"f083", cat:"Nuts & Fats", name:"Peanut Butter",             serving:"1 tbsp",    cal:95,  p:4,  c:3,  f:8  },
  // misc
  { id:"f090", cat:"Misc",      name:"Light Granola",               serving:"2 tbsp",    cal:60,  p:1,  c:11, f:1  },
  { id:"f091", cat:"Misc",      name:"Olive Oil",                   serving:"1 tbsp",    cal:120, p:0,  c:0,  f:14 },
  { id:"f092", cat:"Misc",      name:"Salad Dressing (light)",      serving:"2 tbsp",    cal:45,  p:0,  c:3,  f:4  },
  // deli meats
  { id:"f100", cat:"Deli",      name:"Turkey Breast (deli)",        serving:"2 oz",      cal:60,  p:10, c:2,  f:1  },
  { id:"f101", cat:"Deli",      name:"Salami (Genoa)",              serving:"1 oz (3 sl)",cal:110,p:6,  c:1,  f:9  },
  { id:"f102", cat:"Deli",      name:"Pepperoni",                   serving:"1 oz (7 sl)",cal:140,p:5,  c:1,  f:13 },
  { id:"f103", cat:"Deli",      name:"Ham (deli)",                  serving:"2 oz",      cal:60,  p:10, c:2,  f:2  },
  { id:"f104", cat:"Deli",      name:"Roast Beef (deli)",           serving:"2 oz",      cal:80,  p:12, c:1,  f:3  },
  { id:"f105", cat:"Deli",      name:"Prosciutto",                  serving:"1 oz",      cal:70,  p:7,  c:0,  f:5  },
  { id:"f106", cat:"Deli",      name:"Capicola",                    serving:"1 oz",      cal:80,  p:6,  c:0,  f:6  },
  { id:"f107", cat:"Deli",      name:"Mortadella",                  serving:"1 oz",      cal:90,  p:4,  c:1,  f:8  },
  // sandwich / bread
  { id:"f110", cat:"Bread",     name:"Sandwich Roll (hoagie)",      serving:"1 roll",    cal:200, p:7,  c:38, f:2  },
  { id:"f111", cat:"Bread",     name:"Whole Wheat Bread",           serving:"1 slice",   cal:80,  p:4,  c:15, f:1  },
  { id:"f112", cat:"Bread",     name:"White Bread",                 serving:"1 slice",   cal:75,  p:3,  c:14, f:1  },
  { id:"f113", cat:"Bread",     name:"Wrap / Flour Tortilla (10\")",serving:"1 wrap",    cal:190, p:5,  c:33, f:4  },
  { id:"f114", cat:"Bread",     name:"Pita Bread",                  serving:"1 pita",    cal:165, p:5,  c:33, f:1  },
  { id:"f115", cat:"Bread",     name:"Sourdough Roll",              serving:"1 roll",    cal:170, p:6,  c:32, f:1  },
  // condiments / toppings
  { id:"f120", cat:"Condiments",name:"Mayonnaise",                  serving:"1 tbsp",    cal:90,  p:0,  c:0,  f:10 },
  { id:"f121", cat:"Condiments",name:"Yellow Mustard",              serving:"1 tsp",     cal:3,   p:0,  c:0,  f:0  },
  { id:"f122", cat:"Condiments",name:"Dijon Mustard",               serving:"1 tsp",     cal:5,   p:0,  c:0,  f:0  },
  { id:"f123", cat:"Condiments",name:"Hot Sauce",                   serving:"1 tsp",     cal:0,   p:0,  c:0,  f:0  },
  { id:"f124", cat:"Condiments",name:"Ketchup",                     serving:"1 tbsp",    cal:20,  p:0,  c:5,  f:0  },
  { id:"f125", cat:"Condiments",name:"Ranch Dressing",              serving:"2 tbsp",    cal:130, p:1,  c:2,  f:13 },
  { id:"f126", cat:"Condiments",name:"Balsamic Vinegar",            serving:"1 tbsp",    cal:14,  p:0,  c:3,  f:0  },
  { id:"f127", cat:"Condiments",name:"Olive Oil & Vinegar drizzle", serving:"1 tbsp",    cal:60,  p:0,  c:1,  f:7  },
  // sandwich toppings / sides
  { id:"f130", cat:"Toppings",  name:"Provolone Cheese",            serving:"1 slice",   cal:100, p:7,  c:1,  f:8  },
  { id:"f131", cat:"Toppings",  name:"American Cheese",             serving:"1 slice",   cal:95,  p:5,  c:2,  f:7  },
  { id:"f132", cat:"Toppings",  name:"Swiss Cheese",                serving:"1 slice",   cal:106, p:8,  c:2,  f:8  },
  { id:"f133", cat:"Toppings",  name:"Cheddar Cheese",              serving:"1 slice",   cal:113, p:7,  c:0,  f:9  },
  { id:"f134", cat:"Toppings",  name:"Lettuce",                     serving:"2 leaves",  cal:5,   p:0,  c:1,  f:0  },
  { id:"f135", cat:"Toppings",  name:"Tomato",                      serving:"2 slices",  cal:11,  p:0,  c:2,  f:0  },
  { id:"f136", cat:"Toppings",  name:"Red Onion",                   serving:"2 slices",  cal:10,  p:0,  c:2,  f:0  },
  { id:"f137", cat:"Toppings",  name:"Banana Peppers",              serving:"5 rings",   cal:5,   p:0,  c:1,  f:0  },
  { id:"f138", cat:"Toppings",  name:"Pickles",                     serving:"3 slices",  cal:5,   p:0,  c:1,  f:0  },
  { id:"f139", cat:"Toppings",  name:"Jalapeños",                   serving:"5 rings",   cal:4,   p:0,  c:1,  f:0  },
  { id:"f140", cat:"Toppings",  name:"Avocado",                     serving:"¼ avocado", cal:60,  p:1,  c:3,  f:5  },
  // sides / prepared
  { id:"f150", cat:"Sides",     name:"Coleslaw (Hasbrouck/deli)",   serving:"½ cup",     cal:180, p:1,  c:18, f:12 },
  { id:"f151", cat:"Sides",     name:"Coleslaw (light/vinegar)",    serving:"½ cup",     cal:80,  p:1,  c:12, f:3  },
  { id:"f152", cat:"Sides",     name:"Pasta Salad (deli)",          serving:"½ cup",     cal:200, p:5,  c:28, f:8  },
  { id:"f153", cat:"Sides",     name:"Potato Chips (small bag)",    serving:"1 oz",      cal:150, p:2,  c:15, f:10 },
  { id:"f154", cat:"Sides",     name:"Pretzel (small)",             serving:"1 oz",      cal:110, p:3,  c:23, f:1  },
  { id:"f155", cat:"Sides",     name:"Side Salad (no dressing)",    serving:"1 salad",   cal:20,  p:1,  c:4,  f:0  },
  { id:"f156", cat:"Sides",     name:"Cup of Soup (broth-based)",   serving:"1 cup",     cal:80,  p:5,  c:10, f:2  },
  // fruit — expanded
  { id:"f160", cat:"Fruit",     name:"Clementine",                  serving:"1 fruit",   cal:35,  p:1,  c:9,  f:0  },
  { id:"f161", cat:"Fruit",     name:"Apple (medium)",              serving:"1 apple",   cal:95,  p:0,  c:25, f:0  },
  { id:"f162", cat:"Fruit",     name:"Orange (medium)",             serving:"1 orange",  cal:65,  p:1,  c:16, f:0  },
  { id:"f163", cat:"Fruit",     name:"Grapes (1 cup)",              serving:"1 cup",     cal:104, p:1,  c:27, f:0  },
  { id:"f164", cat:"Fruit",     name:"Watermelon (1 cup diced)",    serving:"1 cup",     cal:46,  p:1,  c:12, f:0  },
  { id:"f165", cat:"Fruit",     name:"Mango (½ cup)",               serving:"½ cup",     cal:53,  p:0,  c:14, f:0  },
  { id:"f166", cat:"Fruit",     name:"Peach (medium)",              serving:"1 peach",   cal:58,  p:1,  c:14, f:0  },
  { id:"f167", cat:"Fruit",     name:"Pineapple (½ cup)",           serving:"½ cup",     cal:41,  p:0,  c:11, f:0  },
  // drinks
  { id:"f170", cat:"Drinks",    name:"Black Coffee",                serving:"12 oz",     cal:5,   p:0,  c:0,  f:0  },
  { id:"f171", cat:"Drinks",    name:"Espresso (double)",           serving:"2 oz",      cal:10,  p:0,  c:1,  f:0  },
  { id:"f172", cat:"Drinks",    name:"OJ (8 oz)",                   serving:"8 oz",      cal:110, p:2,  c:26, f:0  },
  { id:"f173", cat:"Drinks",    name:"Gatorade (20 oz)",            serving:"20 oz",     cal:140, p:0,  c:36, f:0  },
  { id:"f174", cat:"Drinks",    name:"Protein Water / LMNT",        serving:"1 packet",  cal:10,  p:0,  c:2,  f:0  },
];

// eslint-disable-next-line no-unused-vars
const ALL_CATS = [...new Set(SEED_FOODS.map(f => f.cat))];

const MEAL_SLOTS = [
  { key:"Pre-Workout",       icon:"🏋️", color:"#7C3AED", note:"Before lifting" },
  { key:"Post-Workout",      icon:"⚡",  color:"#059669", note:"Lift: eggs · Bike: shake" },
  { key:"Mid-Morning Snack", icon:"🫐",  color:"#0284C7", note:"Yogurt window" },
  { key:"Lunch",             icon:"🥗",  color:"#D97706", note:"Anchor protein meal" },
  { key:"Afternoon Snack",   icon:"🌰",  color:"#B45309", note:"Pre-portioned" },
  { key:"Dinner",            icon:"🍽️", color:"#DC2626", note:"Build your plate" },
  { key:"Dessert",           icon:"🍓",  color:"#DB2777", note:"Fruit first" },
];

// ── helpers ───────────────────────────────────────────────────
const A = "#16A34A", R = "#DC2626";
const todayStr = () => new Date().toISOString().slice(0,10);
const fmt = d => { const [,m,dy] = d.split("-"); return `${+m}/${+dy}`; };
const DOW = d => ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][new Date(d+"T12:00:00").getDay()];
const weekOf = d => Math.max(1, Math.min(TOTAL_WEEKS, Math.floor((new Date(d+"T12:00:00") - new Date("2026-04-20T12:00:00")) / (7*86400000)) + 1));
const tgtW = w => +(START_WEIGHT - Math.min(w,TOTAL_WEEKS)*WEEKLY_LOSS).toFixed(1);
const uid = () => "u" + Date.now() + Math.random().toString(36).slice(2,6);

function slotMacros(items=[]) {
  return items.reduce((acc,it) => ({
    cal: acc.cal + Math.round((it.cal||0)*it.qty),
    p:   acc.p   + Math.round((it.p||0)*it.qty),
    c:   acc.c   + Math.round((it.c||0)*it.qty),
    f:   acc.f   + Math.round((it.f||0)*it.qty),
  }), {cal:0,p:0,c:0,f:0});
}
function dayMacros(meals={}) {
  return Object.values(meals).reduce((acc,items) => {
    const m = slotMacros(items);
    return {cal:acc.cal+m.cal, p:acc.p+m.p, c:acc.c+m.c, f:acc.f+m.f};
  }, {cal:0,p:0,c:0,f:0});
}

// ── ui primitives ─────────────────────────────────────────────
function Card({children,style={}}) {
  return <div style={{background:"#fff",border:"1px solid #E8E8E0",borderRadius:14,padding:"16px 18px",boxShadow:"0 1px 3px rgba(0,0,0,0.04)",...style}}>{children}</div>;
}
function Lbl({children,color="#aaa",style={}}) {
  return <div style={{fontSize:10,letterSpacing:2,textTransform:"uppercase",color,fontFamily:"'DM Mono',monospace",marginBottom:5,...style}}>{children}</div>;
}
function MacroBar({label,val,target,color}) {
  const pct = Math.min(100,Math.round((val/target)*100));
  const over = val>target;
  return (
    <div style={{flex:1,minWidth:90}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
        <span style={{fontSize:10,color:"#aaa",fontFamily:"'DM Mono',monospace",textTransform:"uppercase",letterSpacing:1}}>{label}</span>
        <span style={{fontSize:11,fontWeight:700,color:over?R:color,fontFamily:"'DM Mono',monospace"}}>{val}<span style={{color:"#ccc",fontWeight:400}}>/{target}</span></span>
      </div>
      <div style={{height:7,background:"#F0F0E8",borderRadius:4}}>
        <div style={{height:"100%",width:`${pct}%`,background:over?R:color,borderRadius:4,transition:"width 0.3s"}}/>
      </div>
    </div>
  );
}

// ── food search picker ────────────────────────────────────────
function FoodPicker({library, onAddAll, onClose}) {
  const [pickerTab, setPickerTab] = useState("library");
  // shared cart — persists across tab switches
  const [cart, setCart] = useState([]); // [{...food, qty, logId}]
  // library tab
  const [q, setQ]     = useState("");
  const [cat, setCat] = useState("All");
  // search tab
  const [dbQ, setDbQ]           = useState("");
  const [dbResults, setDbResults] = useState([]);
  const [dbLoading, setDbLoading] = useState(false);
  const [dbError, setDbError]    = useState(null);
  // custom tab
  const [cf, setCf] = useState({name:"",serving:"",cal:"",p:"",c:"",f:""});

  const iStyle = {padding:"9px 12px",borderRadius:9,border:"1px solid #E8E8E0",background:"#F9F9F6",fontSize:14,outline:"none",boxSizing:"border-box"};

  // ── cart helpers ──
  const cartTotal = cart.reduce((a,i)=>({cal:a.cal+Math.round(i.cal*i.qty),p:a.p+Math.round(i.p*i.qty),c:a.c+Math.round(i.c*i.qty),f:a.f+Math.round(i.f*i.qty)}),{cal:0,p:0,c:0,f:0});
  const inCart = (id) => cart.find(i=>i.id===id);

  const toggleCart = (food, qty=1) => {
    if (inCart(food.id)) {
      setCart(c=>c.filter(i=>i.id!==food.id));
    } else {
      setCart(c=>[...c, {...food, qty, logId:uid()}]);
    }
  };
  const setCartQty = (id, val) => setCart(c=>c.map(i=>i.id===id?{...i,qty:parseFloat(val)||1}:i));
  const removeFromCart = (id) => setCart(c=>c.filter(i=>i.id!==id));

  const commitCart = () => {
    if (cart.length===0) return;
    onAddAll(cart);
  };

  // ── library ──
  const cats = ["All", ...new Set(library.map(f=>f.cat))];
  const filtered = library.filter(f=>{
    const inCat = cat==="All"||f.cat===cat;
    const inQ   = !q||f.name.toLowerCase().includes(q.toLowerCase());
    return inCat&&inQ;
  });

  const searchDb = async () => {
    if (!dbQ.trim()) return;
    setDbLoading(true); setDbError(null); setDbResults([]);
    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 600,
          system: "You are a nutrition database. You ONLY output raw JSON arrays. No markdown, no backticks, no explanation. Just the JSON array starting with [ and ending with ].",
          messages: [{
            role: "user",
            content: `Nutrition data for: ${dbQ}\n\nReturn a JSON array of up to 5 items:\n[{"name":"...","serving":"...","cal":0,"p":0,"c":0,"f":0}]\nAll numbers must be integers. Include variations if relevant.`
          }]
        })
      });
      const data = await resp.json();
      if (data.error) throw new Error(data.error.message);
      const raw = (data.content || []).map(b => b.text || "").join("").trim();
      // find the array wherever it appears
      const start = raw.indexOf("[");
      const end   = raw.lastIndexOf("]");
      if (start === -1 || end === -1) throw new Error("No data returned");
      const parsed = JSON.parse(raw.slice(start, end + 1));
      if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("Empty results");
      setDbResults(parsed.map((item, i) => ({
        id:  "ai_" + Date.now() + i,
        cat: "AI Lookup",
        name: String(item.name || "Unknown"),
        serving: String(item.serving || "1 serving"),
        cal: Math.abs(Math.round(+item.cal || 0)),
        p:   Math.abs(Math.round(+item.p   || 0)),
        c:   Math.abs(Math.round(+item.c   || 0)),
        f:   Math.abs(Math.round(+item.f   || 0)),
      })).filter(item => item.cal > 0));
    } catch (e) {
      setDbError("Search failed — try again or use Custom Entry to log manually.");
      console.error(e);
    }
    setDbLoading(false);
  };

  // ── custom food ──
  const addCustom = (saveToLib=false) => {
    if (!cf.name||!cf.cal) return;
    const food = {id:uid(),cat:"My Foods",name:cf.name,serving:cf.serving||"1 serving",
      cal:+cf.cal,p:+cf.p||0,c:+cf.c||0,f:+cf.f||0};
    setCart(c=>[...c,{...food,qty:1,logId:uid(),isNew:saveToLib}]);
    setCf({name:"",serving:"",cal:"",p:"",c:"",f:""});
  };

  const FoodRow = ({food}) => {
    const sel = !!inCart(food.id);
    const item = inCart(food.id);
    return (
      <div style={{display:"flex",alignItems:"center",gap:10,padding:"9px 0",borderBottom:"1px solid #F8F8F5"}}>
        <button onClick={()=>toggleCart(food)} style={{
          width:24,height:24,borderRadius:6,border:`2px solid ${sel?A:"#D8D8D0"}`,
          background:sel?A:"#fff",cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",
        }}>{sel&&<span style={{color:"#fff",fontSize:14,lineHeight:1}}>✓</span>}</button>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:13,color:"#111",fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{food.name}</div>
          <div style={{fontSize:11,color:"#bbb",fontFamily:"'DM Mono',monospace",marginTop:1}}>
            {food.serving} · {food.cal}cal · {food.p}p · {food.c}c · {food.f}f
          </div>
        </div>
        {sel && (
          <div style={{display:"flex",alignItems:"center",gap:4,flexShrink:0}}>
            <span style={{fontSize:11,color:"#bbb"}}>×</span>
            <input type="number" step="0.5" min="0.5" value={item.qty}
              onChange={e=>setCartQty(food.id,e.target.value)}
              onClick={e=>e.stopPropagation()}
              style={{width:40,padding:"4px 5px",borderRadius:7,border:"1px solid "+A+"55",background:"#F0FAF4",fontSize:13,fontFamily:"'DM Mono',monospace",outline:"none",textAlign:"center",color:A,fontWeight:600}}/>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:100,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:"20px 20px 0 0",width:"100%",maxWidth:820,maxHeight:"85vh",display:"flex",flexDirection:"column",boxShadow:"0 -4px 32px rgba(0,0,0,0.18)"}}>

        {/* top bar */}
        <div style={{padding:"14px 18px 0",borderBottom:"1px solid #F0F0E8",flexShrink:0}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <div style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontWeight:700,fontSize:17,color:"#111"}}>Add Foods</div>
            <button onClick={onClose} style={{fontSize:12,padding:"5px 14px",borderRadius:8,border:"1px solid #E8E8E0",background:"#F9F9F6",color:"#888",cursor:"pointer"}}>Cancel</button>
          </div>
          {/* tab nav */}
          <div style={{display:"flex",gap:0}}>
            {[["library","My Library"],["search","AI Search"],["custom","Custom"]].map(([id,lbl])=>(
              <button key={id} onClick={()=>setPickerTab(id)} style={{
                padding:"7px 16px",border:"none",background:"transparent",fontSize:13,fontWeight:600,cursor:"pointer",
                color:pickerTab===id?A:"#bbb",borderBottom:`2px solid ${pickerTab===id?A:"transparent"}`,
                fontFamily:"'DM Sans',sans-serif",transition:"all 0.15s",
              }}>{lbl}</button>
            ))}
          </div>
        </div>

        {/* scrollable content */}
        <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>

          {/* ── LIBRARY ── */}
          {pickerTab==="library" && (
            <div style={{display:"flex",flexDirection:"column",flex:1,overflow:"hidden"}}>
              <div style={{padding:"10px 18px 6px",flexShrink:0}}>
                <input value={q} onChange={e=>setQ(e.target.value)} autoFocus placeholder="Search library..."
                  style={{...iStyle,width:"100%",marginBottom:8}}/>
                <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                  {cats.map(c=>(
                    <button key={c} onClick={()=>setCat(c)} style={{fontSize:10,padding:"3px 9px",borderRadius:99,cursor:"pointer",
                      border:`1px solid ${cat===c?A:"#E8E8E0"}`,background:cat===c?A+"15":"#F9F9F6",
                      color:cat===c?A:"#999",fontWeight:cat===c?600:400,fontFamily:"'DM Mono',monospace"}}>{c}</button>
                  ))}
                </div>
              </div>
              <div style={{overflowY:"auto",padding:"0 18px 10px",flex:1}}>
                {filtered.length===0&&<div style={{textAlign:"center",padding:"24px",color:"#ccc",fontSize:13}}>No matches — try the USDA Search tab</div>}
                {filtered.map(food=><FoodRow key={food.id} food={food}/>)}
              </div>
            </div>
          )}

          {/* ── AI SEARCH ── */}
          {pickerTab==="search" && (
            <div style={{display:"flex",flexDirection:"column",flex:1,overflow:"hidden"}}>
              <div style={{padding:"10px 18px 8px",flexShrink:0}}>
                <div style={{display:"flex",gap:8}}>
                  <input value={dbQ} onChange={e=>setDbQ(e.target.value)}
                    onKeyDown={e=>e.key==="Enter"&&searchDb()} autoFocus
                    placeholder="e.g. turkey breast, clementine, salami, coleslaw..."
                    style={{...iStyle,flex:1}}/>
                  <button onClick={searchDb} disabled={dbLoading||!dbQ.trim()} style={{
                    background:A,color:"#fff",border:"none",borderRadius:9,padding:"9px 20px",
                    fontWeight:700,fontSize:13,cursor:"pointer",opacity:(dbLoading||!dbQ.trim())?0.5:1,whiteSpace:"nowrap",
                  }}>{dbLoading?"…":"Search"}</button>
                </div>
                <div style={{fontSize:11,color:"#bbb",marginTop:6}}>AI-powered · search any food, brand, or dish · hit Enter or tap Search</div>
              </div>
              <div style={{overflowY:"auto",padding:"0 18px 10px",flex:1}}>
                {dbLoading&&<div style={{textAlign:"center",padding:"28px",color:"#bbb",fontSize:13}}>Looking up nutrition data…</div>}
                {dbError&&<div style={{padding:"14px",background:"#FFF5F5",borderRadius:10,color:R,fontSize:13,margin:"8px 0"}}>{dbError}</div>}
                {!dbLoading&&!dbError&&dbResults.length===0&&(
                  <div style={{textAlign:"center",padding:"28px",color:"#ccc",fontSize:13,lineHeight:1.6}}>
                    Search any food and hit Enter<br/>
                    <span style={{fontSize:11}}>turkey · clementine · salami · coleslaw · anything</span>
                  </div>
                )}
                {dbResults.map(food=><FoodRow key={food.id} food={food}/>)}
              </div>
            </div>
          )}

          {/* ── CUSTOM ── */}
          {pickerTab==="custom" && (
            <div style={{padding:"14px 18px",overflowY:"auto",flex:1}}>
              <div style={{fontSize:12,color:"#aaa",marginBottom:12}}>Manually enter macros for anything not in the database.</div>
              <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:10,marginBottom:10}}>
                <div><Lbl>Food Name</Lbl><input value={cf.name} onChange={e=>setCf(p=>({...p,name:e.target.value}))} placeholder="e.g. Mom's Chicken Soup" style={{...iStyle,width:"100%"}}/></div>
                <div><Lbl>Serving Size</Lbl><input value={cf.serving} onChange={e=>setCf(p=>({...p,serving:e.target.value}))} placeholder="1 cup" style={{...iStyle,width:"100%"}}/></div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:14}}>
                {[["cal","Cal","#F59E0B"],["p","Protein g",A],["c","Carbs g","#0284C7"],["f","Fat g","#7C3AED"]].map(([k,lbl,col])=>(
                  <div key={k}>
                    <Lbl color={col}>{lbl}</Lbl>
                    <input type="number" value={cf[k]} onChange={e=>setCf(p=>({...p,[k]:e.target.value}))} placeholder="0"
                      style={{...iStyle,width:"100%",fontFamily:"'DM Mono',monospace",fontSize:15,fontWeight:700,color:col}}/>
                  </div>
                ))}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                <button onClick={()=>addCustom(false)} disabled={!cf.name||!cf.cal} style={{background:A,color:"#fff",border:"none",borderRadius:10,padding:"11px",fontWeight:700,fontSize:13,cursor:"pointer",opacity:(!cf.name||!cf.cal)?0.4:1}}>Add to Cart</button>
                <button onClick={()=>addCustom(true)}  disabled={!cf.name||!cf.cal} style={{background:"#F0FAF4",color:A,border:`1px solid ${A}44`,borderRadius:10,padding:"11px",fontWeight:700,fontSize:13,cursor:"pointer",opacity:(!cf.name||!cf.cal)?0.4:1}}>Add + Save to Library</button>
              </div>
            </div>
          )}
        </div>

        {/* ── cart / commit bar ── */}
        <div style={{borderTop:"1px solid #F0F0E8",padding:"12px 18px",flexShrink:0,background:"#FAFAF7"}}>
          {cart.length>0 ? (
            <>
              {/* cart items */}
              <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
                {cart.map(item=>(
                  <div key={item.logId} style={{display:"flex",alignItems:"center",gap:5,background:A+"12",border:`1px solid ${A}33`,borderRadius:20,padding:"4px 10px"}}>
                    <span style={{fontSize:12,color:A,fontWeight:600}}>{item.name}</span>
                    {item.qty!==1&&<span style={{fontSize:11,color:A+"99"}}>×{item.qty}</span>}
                    <span style={{fontSize:11,color:A+"88",fontFamily:"'DM Mono',monospace"}}>{Math.round(item.cal*item.qty)}cal</span>
                    <button onClick={()=>removeFromCart(item.id)} style={{background:"none",border:"none",cursor:"pointer",color:A+"77",fontSize:13,padding:"0 0 0 2px",lineHeight:1}}>×</button>
                  </div>
                ))}
              </div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div style={{fontSize:12,color:"#888",fontFamily:"'DM Mono',monospace"}}>
                  {cartTotal.cal} cal · {cartTotal.p}g protein · {cartTotal.c}g carbs · {cartTotal.f}g fat
                </div>
                <button onClick={commitCart} style={{background:A,color:"#fff",border:"none",borderRadius:10,padding:"10px 24px",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"'Bricolage Grotesque',sans-serif"}}>
                  Add {cart.length} item{cart.length>1?"s":""} to Log →
                </button>
              </div>
            </>
          ) : (
            <div style={{textAlign:"center",color:"#ccc",fontSize:13}}>Tap foods above to add them to your log</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── meal slot ─────────────────────────────────────────────────
function MealSlot({meta, items=[], onUpdate, library}) {
  const [open, setOpen]   = useState(false);
  const [picker, setPicker] = useState(false);
  const totals = slotMacros(items);
  const logged = items.length > 0;

  const removeItem = (logId) => onUpdate(items.filter(i=>i.logId!==logId));
  const updateQty  = (logId, val) => onUpdate(items.map(i=>i.logId===logId?{...i,qty:parseFloat(val)||1}:i));
  const addFood    = (foods) => {
    const newItems = Array.isArray(foods) ? foods : [foods];
    onUpdate([...items, ...newItems]);
    setPicker(false);
  };

  return (
    <>
      <Card style={{marginBottom:9,borderLeft:`4px solid ${meta.color}`,paddingLeft:16,paddingRight:16}}>
        <div onClick={()=>setOpen(o=>!o)} style={{cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontWeight:700,fontSize:14,color:"#111"}}>{meta.icon} {meta.key}</div>
            <div style={{fontSize:11,color:"#bbb",marginTop:1}}>{meta.note}</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            {logged ? (
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:14,fontWeight:700,color:meta.color}}>{totals.cal} <span style={{fontSize:10,fontWeight:400,color:"#bbb"}}>cal</span></div>
                <div style={{fontSize:11,color:"#bbb"}}>{totals.p}g protein</div>
              </div>
            ) : (
              <div style={{fontSize:11,color:"#ccc",fontFamily:"'DM Mono',monospace"}}>tap to log</div>
            )}
            <div style={{fontSize:18,color:"#ccc",transition:"transform 0.2s",transform:open?"rotate(90deg)":"none",lineHeight:1}}>›</div>
          </div>
        </div>

        {open && (
          <div style={{marginTop:12,paddingTop:12,borderTop:"1px solid #F5F5F0"}}>
            {items.length>0 && (
              <div style={{marginBottom:10}}>
                {items.map(it=>(
                  <div key={it.logId} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",background:"#F9F9F6",borderRadius:9,marginBottom:5}}>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,color:"#333",fontWeight:500}}>{it.name}</div>
                      <div style={{fontSize:11,color:"#bbb",fontFamily:"'DM Mono',monospace"}}>
                        {it.serving} · {Math.round(it.cal*it.qty)}cal · {Math.round(it.p*it.qty)}p · {Math.round(it.c*it.qty)}c · {Math.round(it.f*it.qty)}f
                      </div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:5}}>
                      <span style={{fontSize:11,color:"#bbb"}}>×</span>
                      <input type="number" step="0.5" min="0.5"
                        value={it.qty}
                        onChange={e=>updateQty(it.logId, e.target.value)}
                        style={{width:40,padding:"4px 5px",borderRadius:6,border:"1px solid #E8E8E0",background:"#fff",fontSize:13,fontFamily:"'DM Mono',monospace",outline:"none",textAlign:"center"}}/>
                      <button onClick={()=>removeItem(it.logId)} style={{background:"none",border:"none",cursor:"pointer",fontSize:15,color:"#ddd",padding:"0 2px",lineHeight:1}}>×</button>
                    </div>
                  </div>
                ))}
                {/* slot totals */}
                <div style={{display:"flex",gap:14,padding:"8px 10px",background:meta.color+"08",borderRadius:8,marginTop:6}}>
                  {[["Cal",totals.cal,"#F59E0B"],[`${totals.p}g`,null,"#16A34A"],[`${totals.c}g`,null,"#0284C7"],[`${totals.f}g`,null,"#7C3AED"]].map(([lbl,,col],i)=>(
                    <div key={i} style={{display:"flex",alignItems:"baseline",gap:3}}>
                      <span style={{fontFamily:"'DM Mono',monospace",fontWeight:700,fontSize:13,color:col}}>{lbl}</span>
                      <span style={{fontSize:10,color:"#bbb"}}>{["","protein","carbs","fat"][i]}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <button onClick={()=>setPicker(true)} style={{
              width:"100%",padding:"10px",border:`1.5px dashed ${meta.color}55`,borderRadius:10,
              background:meta.color+"06",color:meta.color,fontWeight:600,fontSize:13,cursor:"pointer",
              fontFamily:"'DM Sans',sans-serif",
            }}>+ Add Food</button>
          </div>
        )}
      </Card>

      {picker && <FoodPicker library={library} onAddAll={addFood} onClose={()=>setPicker(false)}/>}
    </>
  );
}

// ── library manager ───────────────────────────────────────────
function LibraryManager({library, onSave}) {
  const [search, setSearch] = useState("");
  const [cat, setCat]       = useState("All");
  const [editing, setEditing] = useState(null);
  const [form, setForm]      = useState({});

  const cats = ["All", ...new Set(library.map(f=>f.cat))];
  const filtered = library.filter(f => {
    const inCat = cat==="All"||f.cat===cat;
    const inQ   = !search||f.name.toLowerCase().includes(search.toLowerCase());
    return inCat&&inQ;
  });

  const startEdit = (f) => { setEditing(f.id); setForm({...f}); };
  const cancelEdit = () => { setEditing(null); setForm({}); };
  const saveEdit = () => {
    onSave(library.map(f=>f.id===editing?{...form,cal:+form.cal,p:+form.p,c:+form.c,f:+form.f}:f));
    cancelEdit();
  };
  const deleteFood = (id) => onSave(library.filter(f=>f.id!==id));
  const addNew = () => {
    const blank = {id:uid(),cat:"My Foods",name:"New Food",serving:"1 serving",cal:0,p:0,c:0,f:0};
    onSave([...library, blank]);
    startEdit(blank);
  };

  return (
    <div>
      <div style={{display:"flex",gap:8,marginBottom:14,alignItems:"center"}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search library..."
          style={{flex:1,padding:"9px 12px",borderRadius:9,border:"1px solid #E8E8E0",background:"#fff",fontSize:14,outline:"none"}}/>
        <button onClick={addNew} style={{background:A,color:"#fff",border:"none",borderRadius:9,padding:"9px 18px",fontWeight:700,fontSize:13,cursor:"pointer",whiteSpace:"nowrap",fontFamily:"'Bricolage Grotesque',sans-serif"}}>
          + Add Food
        </button>
      </div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>
        {cats.map(c=>(
          <button key={c} onClick={()=>setCat(c)} style={{fontSize:11,padding:"4px 10px",borderRadius:99,cursor:"pointer",
            border:`1px solid ${cat===c?A:"#E8E8E0"}`,background:cat===c?A+"15":"#F9F9F6",
            color:cat===c?A:"#888",fontWeight:cat===c?600:400,fontFamily:"'DM Mono',monospace"}}>
            {c}
          </button>
        ))}
      </div>

      {filtered.map(food=>(
        <Card key={food.id} style={{marginBottom:8}}>
          {editing===food.id ? (
            <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:8}}>
              <div>
                <Lbl>Name</Lbl>
                <input value={form.name||""} onChange={e=>setForm(p=>({...p,name:e.target.value}))}
                  style={{width:"100%",padding:"7px 10px",borderRadius:7,border:"1px solid #E8E8E0",background:"#F9F9F6",fontSize:13,outline:"none",boxSizing:"border-box"}}/>
              </div>
              <div>
                <Lbl>Serving</Lbl>
                <input value={form.serving||""} onChange={e=>setForm(p=>({...p,serving:e.target.value}))}
                  style={{width:"100%",padding:"7px 10px",borderRadius:7,border:"1px solid #E8E8E0",background:"#F9F9F6",fontSize:13,outline:"none",boxSizing:"border-box"}}/>
              </div>
              <div>
                <Lbl>Category</Lbl>
                <input value={form.cat||""} onChange={e=>setForm(p=>({...p,cat:e.target.value}))}
                  style={{width:"100%",padding:"7px 10px",borderRadius:7,border:"1px solid #E8E8E0",background:"#F9F9F6",fontSize:13,outline:"none",boxSizing:"border-box"}}/>
              </div>
              <div/>
              {[["cal","Calories"],["p","Protein g"],["c","Carbs g"],["f","Fat g"]].map(([k,lbl])=>(
                <div key={k}>
                  <Lbl>{lbl}</Lbl>
                  <input type="number" value={form[k]||""} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))}
                    style={{width:"100%",padding:"7px 10px",borderRadius:7,border:"1px solid #E8E8E0",background:"#F9F9F6",fontSize:13,outline:"none",boxSizing:"border-box",fontFamily:"'DM Mono',monospace"}}/>
                </div>
              ))}
              <div style={{gridColumn:"1/-1",display:"flex",gap:8,marginTop:4}}>
                <button onClick={saveEdit} style={{background:A,color:"#fff",border:"none",borderRadius:8,padding:"8px 20px",fontWeight:700,fontSize:13,cursor:"pointer"}}>Save</button>
                <button onClick={cancelEdit} style={{background:"#F9F9F6",color:"#888",border:"1px solid #E8E8E0",borderRadius:8,padding:"8px 16px",fontSize:13,cursor:"pointer"}}>Cancel</button>
              </div>
            </div>
          ) : (
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:500,color:"#111"}}>{food.name}</div>
                <div style={{fontSize:11,color:"#bbb",fontFamily:"'DM Mono',monospace",marginTop:1}}>
                  <span style={{color:"#0284C7",marginRight:8}}>{food.cat}</span>
                  {food.serving} · {food.cal}cal · {food.p}p · {food.c}c · {food.f}f
                </div>
              </div>
              <button onClick={()=>startEdit(food)} style={{fontSize:12,padding:"5px 12px",border:"1px solid #E8E8E0",borderRadius:8,background:"#F9F9F6",color:"#888",cursor:"pointer"}}>Edit</button>
              <button onClick={()=>deleteFood(food.id)} style={{fontSize:12,padding:"5px 10px",border:"1px solid #FFE4E4",borderRadius:8,background:"#FFF5F5",color:R,cursor:"pointer"}}>✕</button>
            </div>
          )}
        </Card>
      ))}
      <div style={{fontSize:11,color:"#bbb",marginTop:10,textAlign:"center"}}>{filtered.length} foods · {library.filter(f=>f.cat==="My Foods").length} custom</div>
    </div>
  );
}

// ── main app ──────────────────────────────────────────────────
const CORRECT_PIN = "1935"; // ← change this to whatever PIN you want

function PinScreen({ onUnlock }) {
  const [pin, setPin] = useState("");
  const [shake, setShake] = useState(false);

  const tryPin = (p) => {
    if (p === CORRECT_PIN) {
      sessionStorage.setItem("cut-unlocked", "1");
      onUnlock();
    } else if (p.length === 4) {
      setShake(true);
      setTimeout(() => { setShake(false); setPin(""); }, 600);
    }
  };

  const press = (d) => {
    const next = pin + d;
    setPin(next);
    if (next.length === 4) tryPin(next);
  };

  const del = () => setPin(p => p.slice(0, -1));

  return (
    <div style={{ minHeight:"100vh", background:"#F5F5F0", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", fontFamily:"'DM Sans',sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;600;800&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet"/>
      <div style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontWeight:800, fontSize:28, color:"#111", marginBottom:6 }}>
        THE CUT<span style={{ color:"#16A34A" }}>.</span>
      </div>
      <div style={{ fontSize:12, color:"#bbb", letterSpacing:2, textTransform:"uppercase", fontFamily:"'DM Mono',monospace", marginBottom:40 }}>Enter PIN</div>

      {/* dots */}
      <div style={{ display:"flex", gap:16, marginBottom:40, animation: shake ? "shake 0.5s" : "none" }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{ width:16, height:16, borderRadius:"50%", background: pin.length > i ? "#16A34A" : "#E0E0D8", transition:"background 0.15s" }}/>
        ))}
      </div>

      {/* keypad */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,72px)", gap:12 }}>
        {[1,2,3,4,5,6,7,8,9,"",0,"⌫"].map((d,i) => (
          <button key={i} onClick={() => d === "⌫" ? del() : d !== "" ? press(String(d)) : null}
            style={{
              height:72, borderRadius:14, border:"1px solid #E8E8E0",
              background: d === "" ? "transparent" : "#fff",
              fontSize: d === "⌫" ? 20 : 24, fontWeight:600, color:"#111",
              cursor: d === "" ? "default" : "pointer",
              boxShadow: d === "" ? "none" : "0 1px 3px rgba(0,0,0,0.06)",
              fontFamily:"'DM Mono',monospace",
              visibility: d === "" ? "hidden" : "visible",
            }}>{d}</button>
        ))}
      </div>
      <style>{`@keyframes shake { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-8px)} 40%,80%{transform:translateX(8px)} }`}</style>
    </div>
  );
}

export default function CutTracker() {
  const [unlocked, setUnlocked] = useState(!!sessionStorage.getItem("cut-unlocked"));
  if (!unlocked) return <PinScreen onUnlock={() => setUnlocked(true)} />;
  const [tab, setTab]             = useState("daily");
  const [activeDay, setActiveDay] = useState(todayStr());
  const [dailyLog, setDailyLog]   = useState({});
  const [library, setLibrary]     = useState(SEED_FOODS);
  const [checkins, setCheckins]   = useState({});
  const [weekForm, setWeekForm]   = useState({});
  const [activeWeek, setActiveWeek] = useState(1);
  const [loaded, setLoaded]       = useState(false);
  const [saving, setSaving]       = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [log, chk, lib] = await Promise.all([
          loadDailyLog(),
          loadCheckins(),
          loadLibrary(SEED_FOODS),
        ]);
        setDailyLog(log);
        setCheckins(chk);
        setLibrary(lib);
      } catch(e) { console.error("Load error", e); }
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (checkins[activeWeek]) setWeekForm(checkins[activeWeek]);
    else setWeekForm({});
  }, [activeWeek, loaded, checkins]); // eslint-disable-line react-hooks/exhaustive-deps

  const persistDaily = async (u) => {
    setDailyLog(u);
    const entry = u[activeDay] || {};
    await saveDayEntry(activeDay, entry);
  };

  const persistLib = async (u) => {
    setLibrary(u);
    await saveLibrary(u);
  };

  const saveCheckin = async () => {
    setSaving(true);
    const data = { ...weekForm, savedAt: new Date().toISOString() };
    const u = { ...checkins, [activeWeek]: data };
    setCheckins(u);
    await dbSaveCheckin(activeWeek, data);
    setSaving(false);
  };

  const setDayField = (field,val) => persistDaily({...dailyLog,[activeDay]:{...(dailyLog[activeDay]||{}),[field]:val}});
  const setSlotItems = (slot,items) => {
    const day = dailyLog[activeDay]||{};
    persistDaily({...dailyLog,[activeDay]:{...day,meals:{...(day.meals||{}),[slot]:items}}});
  };

  const curDay   = dailyLog[activeDay]||{};
  const curMeals = curDay.meals||{};
  const totals   = dayMacros(curMeals);
  const wk       = weekOf(activeDay);
  const target   = tgtW(wk);

  const shiftDay = (n) => {
    const d = new Date(activeDay+"T12:00:00"); d.setDate(d.getDate()+n);
    const s = d.toISOString().slice(0,10);
    if(s<=todayStr()) setActiveDay(s);
  };

  const last14 = Array.from({length:14},(_,i)=>{
    const d = new Date(); d.setDate(d.getDate()-(13-i));
    const key = d.toISOString().slice(0,10);
    const e   = dailyLog[key]||{};
    const m   = dayMacros(e.meals||{});
    return {key,date:fmt(key),day:DOW(key),weight:e.weight?+e.weight:null,cal:m.cal||null,prot:m.p||null};
  });
  const latestW   = [...last14].reverse().find(d=>d.weight)?.weight||START_WEIGHT;
  const totalLost = +(START_WEIGHT-latestW).toFixed(1);
  const toGoLow   = +(latestW-GOAL_HIGH).toFixed(1);
  const pct       = Math.min(100,Math.round((totalLost/(START_WEIGHT-GOAL_HIGH))*100));

  const tt = {contentStyle:{background:"#fff",border:"1px solid #E8E8E0",borderRadius:8,fontSize:12,boxShadow:"0 2px 8px rgba(0,0,0,0.07)"}};

  const TABS = [["daily","Daily Log"],["library","My Foods"],["trends","Trends"],["check-in","Check-In"]];

  return (
    <div style={{minHeight:"100vh",background:"#F5F5F0",color:"#1a1a1a",fontFamily:"'DM Sans',sans-serif",paddingBottom:60}}>
      <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;600;800&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet"/>

      {/* header */}
      <div style={{borderBottom:"1px solid #E0E0D8",padding:"16px 20px 0",maxWidth:820,margin:"0 auto",background:"#FAFAF7"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:10}}>
          <div>
            <div style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontWeight:800,fontSize:21,letterSpacing:-0.5,color:"#111"}}>
              THE CUT<span style={{color:A}}>.</span>
            </div>
            <div style={{fontSize:10,color:"#bbb",letterSpacing:1.5,textTransform:"uppercase",fontFamily:"'DM Mono',monospace"}}>
              {START_WEIGHT} → {GOAL_LOW}–{GOAL_HIGH} lbs · 12 weeks
            </div>
          </div>
          <div style={{display:"flex",gap:18}}>
            {[["lost",totalLost>0?`-${totalLost}`:"-",A],["to goal",toGoLow>0?`${toGoLow} lbs`:"✓",toGoLow<=0?A:"#555"],["progress",`${pct}%`,A]].map(([l,v,c])=>(
              <div key={l} style={{textAlign:"right"}}>
                <div style={{fontSize:10,color:"#bbb",fontFamily:"'DM Mono',monospace"}}>{l}</div>
                <div style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontWeight:800,fontSize:17,color:c}}>{v}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{height:3,background:"#EAEAE0",borderRadius:2,marginBottom:12}}>
          <div style={{height:"100%",width:`${pct}%`,background:A,borderRadius:2,transition:"width 0.6s"}}/>
        </div>
        <div style={{display:"flex",gap:2,overflowX:"auto"}}>
          {TABS.map(([id,lbl])=>(
            <button key={id} onClick={()=>setTab(id)} style={{
              padding:"8px 16px",border:"none",background:"transparent",whiteSpace:"nowrap",
              color:tab===id?A:"#aaa",fontWeight:600,fontSize:13,cursor:"pointer",
              borderBottom:`2px solid ${tab===id?A:"transparent"}`,
              fontFamily:"'DM Sans',sans-serif",transition:"all 0.15s",flexShrink:0,
            }}>{lbl}</button>
          ))}
        </div>
      </div>

      <div style={{maxWidth:820,margin:"0 auto",padding:"20px 16px"}}>

        {/* ── DAILY LOG ── */}
        {tab==="daily" && (
          <div>
            {/* day nav */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
              <button onClick={()=>shiftDay(-1)} style={{background:"#fff",border:"1px solid #E8E8E0",borderRadius:9,padding:"8px 16px",cursor:"pointer",fontSize:18,color:"#777",lineHeight:1}}>‹</button>
              <div style={{textAlign:"center"}}>
                <div style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontWeight:700,fontSize:20,color:"#111"}}>{DOW(activeDay)}, {fmt(activeDay)}</div>
                <div style={{fontSize:10,color:activeDay===todayStr()?A:"#bbb",fontFamily:"'DM Mono',monospace",letterSpacing:1.5,textTransform:"uppercase"}}>
                  {activeDay===todayStr()?"Today":`Week ${wk}`}
                </div>
              </div>
              <button onClick={()=>shiftDay(1)} disabled={activeDay>=todayStr()} style={{background:"#fff",border:"1px solid #E8E8E0",borderRadius:9,padding:"8px 16px",fontSize:18,lineHeight:1,cursor:activeDay>=todayStr()?"default":"pointer",color:activeDay>=todayStr()?"#ddd":"#777"}}>›</button>
            </div>

            {/* weight */}
            <Card style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
              <div style={{fontSize:22}}>⚖️</div>
              <div style={{flex:1}}>
                <Lbl>Morning Weight</Lbl>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <input type="number" step="0.1"
                    value={curDay.weight??""}
                    onChange={e=>setDayField("weight",e.target.value)}
                    placeholder={target.toString()}
                    style={{width:80,background:"#F9F9F6",border:"1px solid #E8E8E0",borderRadius:8,padding:"7px 9px",fontSize:17,fontFamily:"'DM Mono',monospace",color:"#111",outline:"none",fontWeight:700}}
                  />
                  <span style={{fontSize:12,color:"#bbb"}}>lbs</span>
                  {curDay.weight && (()=>{
                    const diff = +(+curDay.weight-target).toFixed(1);
                    return <span style={{fontSize:11,fontWeight:600,fontFamily:"'DM Mono',monospace",color:diff<=0?A:R}}>
                      {diff<=0?`↓ ${Math.abs(diff)} ahead`:`↑ ${diff} over target`}
                    </span>;
                  })()}
                </div>
              </div>
              <div style={{textAlign:"right",borderLeft:"1px solid #F0F0E8",paddingLeft:14}}>
                <div style={{fontSize:10,color:"#bbb",fontFamily:"'DM Mono',monospace"}}>wk {wk} target</div>
                <div style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontWeight:700,fontSize:17,color:"#333"}}>{target} lbs</div>
              </div>
            </Card>

            {/* training — multi-select with cardio detail */}
            {(()=>{
              const acts = curDay.activities || {};
              const TYPES = [
                {key:"Rest",  icon:"😴", cardio:false},
                {key:"Lift",  icon:"🏋️", cardio:false},
                {key:"Bike",  icon:"🚴", cardio:true},
                {key:"Run",   icon:"🏃", cardio:true},
                {key:"Walk",  icon:"🚶", cardio:true},
                {key:"Swim",  icon:"🏊", cardio:true},
              ];
              const toggleAct = (key) => {
                if (key==="Rest") { setDayField("activities",{Rest:{}}); return; }
                const next = {...acts};
                if (next.Rest) delete next.Rest;
                if (next[key]) delete next[key];
                else next[key] = {};
                setDayField("activities", next);
              };
              const setActDetail = (key,field,val) => {
                setDayField("activities",{...acts,[key]:{...(acts[key]||{}),[field]:val}});
              };
              const selected = Object.keys(acts);
              return (
                <Card style={{marginBottom:10}}>
                  <Lbl>Training Today — select all that apply</Lbl>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom: selected.some(k=>TYPES.find(t=>t.key===k)?.cardio) ? 12 : 0}}>
                    {TYPES.map(({key,icon,cardio})=>{
                      const on = !!acts[key];
                      return (
                        <button key={key} onClick={()=>toggleAct(key)} style={{
                          fontSize:12,padding:"6px 12px",borderRadius:9,cursor:"pointer",
                          border:`1.5px solid ${on?A:"#E8E8E0"}`,
                          background:on?A+"15":"#FAFAFA",
                          color:on?A:"#777",fontWeight:on?600:400,
                          display:"flex",alignItems:"center",gap:5,
                        }}>{icon} {key}</button>
                      );
                    })}
                  </div>
                  {/* cardio detail rows */}
                  {TYPES.filter(t=>t.cardio && acts[t.key]).map(({key,icon})=>(
                    <div key={key} style={{display:"flex",alignItems:"center",gap:8,padding:"10px 12px",background:A+"08",borderRadius:10,marginTop:8,flexWrap:"wrap"}}>
                      <div style={{fontSize:13,fontWeight:600,color:A,minWidth:52}}>{icon} {key}</div>
                      <div style={{display:"flex",alignItems:"center",gap:5}}>
                        <input type="number" step="0.1" min="0"
                          value={acts[key]?.miles??""}
                          onChange={e=>setActDetail(key,"miles",e.target.value)}
                          placeholder="0.0"
                          style={{width:60,padding:"5px 8px",borderRadius:7,border:"1px solid #D8F0D8",background:"#fff",fontSize:13,fontFamily:"'DM Mono',monospace",outline:"none",textAlign:"center"}}
                        />
                        <span style={{fontSize:12,color:"#999"}}>mi</span>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:5}}>
                        <input type="number" step="10" min="0"
                          value={acts[key]?.elev??""}
                          onChange={e=>setActDetail(key,"elev",e.target.value)}
                          placeholder="0"
                          style={{width:68,padding:"5px 8px",borderRadius:7,border:"1px solid #D8F0D8",background:"#fff",fontSize:13,fontFamily:"'DM Mono',monospace",outline:"none",textAlign:"center"}}
                        />
                        <span style={{fontSize:12,color:"#999"}}>ft elev</span>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:5}}>
                        <input type="number" step="1" min="0"
                          value={acts[key]?.mins??""}
                          onChange={e=>setActDetail(key,"mins",e.target.value)}
                          placeholder="0"
                          style={{width:52,padding:"5px 8px",borderRadius:7,border:"1px solid #D8F0D8",background:"#fff",fontSize:13,fontFamily:"'DM Mono',monospace",outline:"none",textAlign:"center"}}
                        />
                        <span style={{fontSize:12,color:"#999"}}>min</span>
                      </div>
                    </div>
                  ))}
                  {/* summary tag */}
                  {selected.length>0 && (
                    <div style={{marginTop:10,fontSize:12,color:"#888",fontFamily:"'DM Mono',monospace"}}>
                      {selected.map(k=>{
                        const d=acts[k]; const t=TYPES.find(x=>x.key===k);
                        if(!t?.cardio||(!d?.miles&&!d?.elev&&!d?.mins)) return k;
                        const parts=[k];
                        if(d.miles) parts.push(`${d.miles}mi`);
                        if(d.elev)  parts.push(`${d.elev}ft`);
                        if(d.mins)  parts.push(`${d.mins}min`);
                        return parts.join(" · ");
                      }).join("  +  ")}
                    </div>
                  )}
                </Card>
              );
            })()}

            {/* macro bars */}
            <Card style={{marginBottom:10}}>
              <Lbl>Today's Macros</Lbl>
              <div style={{display:"flex",gap:10,flexWrap:"wrap",marginTop:4}}>
                <MacroBar label="Cal"     val={totals.cal} target={CAL_TARGET}     color="#F59E0B"/>
                <MacroBar label="Protein" val={totals.p}   target={PROTEIN_TARGET} color={A}/>
                <MacroBar label="Carbs"   val={totals.c}   target={CARB_TARGET}    color="#0284C7"/>
                <MacroBar label="Fat"     val={totals.f}   target={FAT_TARGET}     color="#7C3AED"/>
              </div>
            </Card>

            {/* meal slots */}
            {MEAL_SLOTS.map(meta=>(
              <MealSlot
                key={meta.key}
                meta={meta}
                items={curMeals[meta.key]||[]}
                library={library}
                onUpdate={items=>setSlotItems(meta.key,items)}
              />
            ))}
          </div>
        )}

        {/* ── MY FOODS LIBRARY ── */}
        {tab==="library" && (
          <div>
            <div style={{marginBottom:16}}>
              <div style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontWeight:700,fontSize:18,marginBottom:4}}>My Food Library</div>
              <div style={{fontSize:12,color:"#aaa"}}>
                {library.length} foods pre-loaded from your staples. Add anything new here — it'll be available in every meal slot.
              </div>
            </div>
            <LibraryManager library={library} onSave={persistLib}/>
          </div>
        )}

        {/* ── TRENDS ── */}
        {tab==="trends" && (
          <div>
            <Card style={{marginBottom:12}}>
              <Lbl>Weight — Last 14 Days</Lbl>
              <ResponsiveContainer width="100%" height={185}>
                <LineChart data={last14} margin={{top:8,right:8,bottom:0,left:-20}}>
                  <XAxis dataKey="day" tick={{fill:"#bbb",fontSize:10}} axisLine={false} tickLine={false}/>
                  <YAxis domain={[170,202]} tick={{fill:"#bbb",fontSize:10}} axisLine={false} tickLine={false}/>
                  <Tooltip {...tt}/>
                  <ReferenceLine y={GOAL_HIGH} stroke={A} strokeDasharray="4 4" strokeOpacity={0.5}/>
                  <Line type="monotone" dataKey="weight" stroke={A} strokeWidth={2.5} dot={{fill:A,r:3}} connectNulls={false} name="Weight (lbs)"/>
                </LineChart>
              </ResponsiveContainer>
            </Card>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
              <Card>
                <Lbl>Calories — Last 14 Days</Lbl>
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart data={last14} margin={{top:6,right:4,bottom:0,left:-24}}>
                    <XAxis dataKey="day" tick={{fill:"#bbb",fontSize:9}} axisLine={false} tickLine={false}/>
                    <YAxis tick={{fill:"#bbb",fontSize:9}} axisLine={false} tickLine={false}/>
                    <Tooltip {...tt}/>
                    <ReferenceLine y={CAL_TARGET} stroke="#F59E0B" strokeDasharray="3 3" strokeOpacity={0.6}/>
                    <Bar dataKey="cal" fill="#F59E0B" opacity={0.85} radius={[3,3,0,0]} name="Calories"/>
                  </BarChart>
                </ResponsiveContainer>
              </Card>
              <Card>
                <Lbl>Protein — Last 14 Days</Lbl>
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart data={last14} margin={{top:6,right:4,bottom:0,left:-24}}>
                    <XAxis dataKey="day" tick={{fill:"#bbb",fontSize:9}} axisLine={false} tickLine={false}/>
                    <YAxis tick={{fill:"#bbb",fontSize:9}} axisLine={false} tickLine={false}/>
                    <Tooltip {...tt}/>
                    <ReferenceLine y={PROTEIN_TARGET} stroke={A} strokeDasharray="3 3" strokeOpacity={0.6}/>
                    <Bar dataKey="prot" fill={A} opacity={0.85} radius={[3,3,0,0]} name="Protein (g)"/>
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>
            <Card>
              <Lbl>12-Week Roadmap</Lbl>
              <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:6,marginTop:8}}>
                {Array.from({length:TOTAL_WEEKS},(_,i)=>{
                  const w=i+1,ci=checkins[w],t=tgtW(w),done=!!ci?.weight,beat=done&&+ci.weight<=t+0.5;
                  return (
                    <button key={w} onClick={()=>{setActiveWeek(w);setTab("check-in");}} style={{
                      padding:"10px 4px",borderRadius:10,cursor:"pointer",textAlign:"center",
                      border:`1px solid ${done?(beat?A+"66":R+"66"):"#E8E8E0"}`,
                      background:done?(beat?A+"15":R+"10"):"#F9F9F6",
                    }}>
                      <div style={{fontSize:9,color:"#bbb",fontFamily:"'DM Mono',monospace"}}>W{w}</div>
                      <div style={{fontSize:12,fontWeight:600,color:done?(beat?A:R):"#ccc",marginTop:2}}>{done?ci.weight:t}</div>
                    </button>
                  );
                })}
              </div>
              <div style={{fontSize:11,color:"#bbb",marginTop:8}}>Tap a week → log check-in. Numbers = target.</div>
            </Card>
          </div>
        )}

        {/* ── WEEKLY CHECK-IN ── */}
        {tab==="check-in" && (
          <div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:16}}>
              {Array.from({length:TOTAL_WEEKS},(_,i)=>i+1).map(w=>(
                <button key={w} onClick={()=>setActiveWeek(w)} style={{
                  padding:"5px 11px",borderRadius:99,cursor:"pointer",fontFamily:"'DM Mono',monospace",
                  fontSize:11,fontWeight:600,letterSpacing:0.4,
                  border:`1.5px solid ${activeWeek===w?A:(checkins[w]?A+"55":"#D8D8D0")}`,
                  background:activeWeek===w?A+"18":(checkins[w]?A+"08":"#F5F5F0"),
                  color:activeWeek===w?A:(checkins[w]?A+"CC":"#aaa"),
                }}>{checkins[w]?"✓ ":""}W{w}</button>
              ))}
            </div>
            <Card style={{marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                <div>
                  <div style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontWeight:700,fontSize:18}}>Week {activeWeek} Check-In</div>
                  <div style={{fontSize:12,color:"#bbb",fontFamily:"'DM Mono',monospace"}}>Target: <span style={{color:A}}>{tgtW(activeWeek)} lbs</span></div>
                </div>
                {checkins[activeWeek]?.savedAt&&<div style={{fontSize:10,color:"#ccc",fontFamily:"'DM Mono',monospace"}}>saved {new Date(checkins[activeWeek].savedAt).toLocaleDateString()}</div>}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                {[{key:"weight",label:"Weight",unit:"lbs",step:"0.1"},{key:"cal",label:"Avg Daily Cal",unit:"cal",step:"10"},{key:"protein",label:"Avg Protein",unit:"g",step:"1"},{key:"workouts",label:"Workouts",unit:"sessions",step:"1"}].map(f=>(
                  <div key={f.key}>
                    <Lbl>{f.label} ({f.unit})</Lbl>
                    <input type="number" step={f.step} value={weekForm[f.key]??""} onChange={e=>setWeekForm(p=>({...p,[f.key]:e.target.value}))}
                      placeholder={f.key==="weight"?tgtW(activeWeek):""}
                      style={{width:"100%",background:"#F9F9F6",border:"1px solid #E8E8E0",borderRadius:8,padding:"10px 12px",fontSize:15,fontFamily:"'DM Mono',monospace",color:"#111",outline:"none",boxSizing:"border-box"}}/>
                  </div>
                ))}
              </div>
              <div style={{marginTop:12}}>
                <Lbl>Energy</Lbl>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  {["Low","Okay","Good","Great"].map(e=>(
                    <button key={e} onClick={()=>setWeekForm(p=>({...p,energy:e}))} style={{padding:"6px 14px",borderRadius:99,fontSize:12,fontWeight:600,cursor:"pointer",border:`1.5px solid ${weekForm.energy===e?A:"#D8D8D0"}`,background:weekForm.energy===e?A+"18":"#F5F5F0",color:weekForm.energy===e?A:"#aaa",fontFamily:"'DM Mono',monospace"}}>{e}</button>
                  ))}
                </div>
              </div>
              <div style={{marginTop:12}}>
                <Lbl>Adherence</Lbl>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  {["Dialed in","Minor slips","Off a few days","Off week"].map(e=>(
                    <button key={e} onClick={()=>setWeekForm(p=>({...p,adherence:e}))} style={{padding:"6px 14px",borderRadius:99,fontSize:12,fontWeight:600,cursor:"pointer",border:`1.5px solid ${weekForm.adherence===e?(e==="Dialed in"?A:R):"#D8D8D0"}`,background:weekForm.adherence===e?(e==="Dialed in"?A:R)+"18":"#F5F5F0",color:weekForm.adherence===e?(e==="Dialed in"?A:R):"#aaa",fontFamily:"'DM Mono',monospace"}}>{e}</button>
                  ))}
                </div>
              </div>
              <div style={{marginTop:12}}>
                <Lbl>Notes</Lbl>
                <textarea rows={3} value={weekForm.notes??""} onChange={e=>setWeekForm(p=>({...p,notes:e.target.value}))} placeholder="How did the week feel?"
                  style={{width:"100%",background:"#F9F9F6",border:"1px solid #E8E8E0",borderRadius:8,padding:"10px 12px",color:"#555",fontSize:13,resize:"vertical",fontFamily:"'DM Sans',sans-serif",outline:"none",boxSizing:"border-box"}}/>
              </div>
              <button onClick={saveCheckin} disabled={saving} style={{marginTop:14,background:A,color:"#fff",border:"none",borderRadius:10,padding:"12px 28px",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"'Bricolage Grotesque',sans-serif",opacity:saving?0.7:1}}>
                {saving?"Saving...":"Save Check-In →"}
              </button>
            </Card>
            {checkins[activeWeek]?.weight&&(()=>{
              const act=+checkins[activeWeek].weight,t=tgtW(activeWeek),diff=+(act-t).toFixed(1),ahead=diff<=0;
              return (
                <Card>
                  <Lbl>Week {activeWeek} Analysis</Lbl>
                  <div style={{display:"flex",gap:20,alignItems:"center",marginTop:8}}>
                    <div style={{fontSize:36,fontFamily:"'Bricolage Grotesque',sans-serif",fontWeight:800,color:ahead?A:R}}>{ahead?`−${Math.abs(diff)}`:`+${diff}`}</div>
                    <div style={{fontSize:13,color:"#777",lineHeight:1.7}}>{ahead?`Ahead by ${Math.abs(diff)} lbs. If energy is low, add 100–150 cal on a training day.`:`Behind by ${diff} lbs. Skip starch at dinner 3–4 days and tighten afternoon snacks.`}</div>
                  </div>
                </Card>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
