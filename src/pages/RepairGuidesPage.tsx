import { useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { vehicleLabel } from '@/lib/utils';
import type { Vehicle } from '@/lib/types';
import { useEffect } from 'react';
import {
  BookOpen,
  Search,
  Car,
  Wrench,
  Gauge,
  Battery,
  Fuel,
  Cog,
  Snowflake,
  CircleAlert,
  Zap,
  Disc,
  Lightbulb,
  ExternalLink,
  Info,
  ChevronRight,
  Clock,
  Wrench as ToolsIcon,
} from 'lucide-react';

interface GuideCategory {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  procedures: GuideProcedure[];
}

interface GuideProcedure {
  title: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  time: string;
  steps: string[];
  tools: string[];
  torqueSpecs?: { part: string; spec: string }[];
}

const GUIDE_CATEGORIES: GuideCategory[] = [
  {
    id: 'engine',
    label: 'Engine & Drivetrain',
    icon: <Cog className="h-5 w-5" />,
    color: 'bg-blue-50 text-blue-600',
    procedures: [
      {
        title: 'Oil & Filter Change',
        difficulty: 'Beginner',
        time: '30-45 min',
        tools: ['Oil filter wrench', 'Socket set (metric)', 'Drain pan', 'Funnel', 'Torque wrench'],
        torqueSpecs: [
          { part: 'Oil drain plug', spec: '25-30 ft-lbs' },
          { part: 'Oil filter', spec: 'Hand tight + 3/4 turn' },
        ],
        steps: [
          'Warm up the engine for 5 minutes to thin the oil, then shut off.',
          'Raise the vehicle on a lift or jack stands. Place a drain pan under the oil pan.',
          'Remove the oil drain plug with the correct socket. Allow all oil to drain completely.',
          'Replace the drain plug washer and torque to specification (25-30 ft-lbs).',
          'Locate and remove the old oil filter using an oil filter wrench. Catch any residual oil.',
          'Lubricate the new filter gasket with fresh oil. Install hand-tight, then 3/4 turn more.',
          'Lower the vehicle. Add the specified amount of new oil through the fill cap.',
          'Start the engine, check for leaks, and verify oil level on the dipstick after 5 minutes.',
        ],
      },
      {
        title: 'Spark Plug Replacement',
        difficulty: 'Intermediate',
        time: '45-60 min',
        tools: ['Spark plug socket', 'Torque wrench', 'Gap gauge', 'Dielectric grease', 'Socket extensions'],
        torqueSpecs: [
          { part: 'Spark plug (new gasket)', spec: '15-20 ft-lbs' },
          { part: 'Spark plug (reused gasket)', spec: '10-15 ft-lbs' },
          { part: 'Ignition coil bolt', spec: '7-10 ft-lbs' },
        ],
        steps: [
          'Allow the engine to cool completely. Working on a hot engine can damage components.',
          'Remove the engine cover if equipped. Label ignition coil connectors before disconnecting.',
          'Disconnect and remove one ignition coil at a time to avoid mixing up firing order.',
          'Blow out the spark plug wells with compressed air to prevent debris from entering the cylinder.',
          'Remove the spark plug with the correct socket and extension. Inspect the old plug for wear patterns.',
          'Gap the new spark plug to the manufacturer specification using a gap gauge.',
          'Install the new spark plug by hand first to avoid cross-threading, then torque to specification.',
          'Apply dielectric grease to the coil boot, reinstall the coil, and repeat for remaining cylinders.',
          'Reconnect all coil connectors, reinstall the engine cover, and start the engine to verify smooth idle.',
        ],
      },
      {
        title: 'Timing Belt/Chain Inspection',
        difficulty: 'Advanced',
        time: '2-3 hours',
        tools: ['Torque wrench', 'Socket set (metric)', 'Harmonic balancer puller', 'Timing light', 'Crank locking tool'],
        steps: [
          'Consult the vehicle service manual for the specific timing belt replacement interval (typically 60K-100K miles).',
          'Disconnect the battery. Remove necessary components to access the timing cover (may include engine mount, accessory belts, crank pulley).',
          'Remove the timing cover bolts and carefully pry off the cover. Note the orientation.',
          'Rotate the engine to Top Dead Center (TDC) on cylinder 1. Align all timing marks.',
          'Inspect the belt/chain for cracking, fraying, glazing, or oil contamination.',
          'If replacing: loosen the tensioner, remove the old belt, install the new belt following the routing diagram.',
          'Verify all timing marks are still aligned after installation. Rotate the engine two full revolutions by hand to confirm.',
          'Reassemble in reverse order. Torque all bolts to specification. Start the engine and verify timing with a timing light.',
        ],
      },
      {
        title: 'Coolant System Service & Thermostat Replacement',
        difficulty: 'Intermediate',
        time: '60-90 min',
        tools: ['Socket set', 'Pliers', 'Drain pan', 'Funnel', 'Coolant tester', 'Torque wrench'],
        torqueSpecs: [
          { part: 'Thermostat housing bolts', spec: '8-10 ft-lbs' },
          { part: 'Drain plug', spec: '15-20 ft-lbs' },
        ],
        steps: [
          'Ensure the engine is completely cool. Never open a hot cooling system.',
          'Place a drain pan under the radiator. Open the radiator drain petcock and drain all coolant.',
          'Locate the thermostat housing (typically where the upper radiator hose meets the engine block).',
          'Remove the housing bolts. Carefully separate the housing and remove the old thermostat.',
          'Clean both mating surfaces thoroughly. Inspect for corrosion or warping.',
          'Install the new thermostat with the spring side facing the engine. Use a new gasket or O-ring.',
          'Torque the housing bolts to specification in a cross pattern. Do not over-tighten.',
          'Refill with the correct coolant mixture (typically 50/50). Bleed air from the system per manufacturer procedure.',
          'Start the engine with the heater on high. Allow to reach operating temperature. Check for leaks and proper thermostat operation.',
        ],
      },
    ],
  },
  {
    id: 'brakes',
    label: 'Brakes',
    icon: <Disc className="h-5 w-5" />,
    color: 'bg-red-50 text-red-600',
    procedures: [
      {
        title: 'Brake Pad Replacement (Front)',
        difficulty: 'Intermediate',
        time: '60-90 min',
        tools: ['Lug wrench', 'Jack & stands', 'C-clamp or caliper piston tool', 'Socket set', 'Brake cleaner', 'Torque wrench'],
        torqueSpecs: [
          { part: 'Caliper mounting bolts', spec: '25-35 ft-lbs' },
          { part: 'Caliper bracket bolts', spec: '80-100 ft-lbs' },
          { part: 'Lug nuts', spec: '80-100 ft-lbs' },
        ],
        steps: [
          'Loosen the lug nuts slightly with the vehicle on the ground. Do not remove yet.',
          'Jack up the vehicle and support with jack stands. Remove the lug nuts and wheel.',
          'Inspect the brake rotor for grooves, heat cracks, or uneven wear. Measure thickness with a micrometer.',
          'Remove the caliper mounting bolts (usually 2). Support the caliper with a wire — do not let it hang by the brake hose.',
          'Slide out the old brake pads. Note their orientation and any wear patterns for diagnostic purposes.',
          'Compress the caliper piston using a C-clamp or piston tool. Remove the old pad from behind the piston if equipped.',
          'Apply brake grease to the pad contact points on the bracket (NOT the friction surface). Install new pads.',
          'Reinstall the caliper over the pads. Torque the caliper mounting bolts to specification.',
          'Reinstall the wheel, hand-tighten lug nuts, lower the vehicle, then torque lug nuts in a star pattern to specification.',
          'Pump the brake pedal several times before driving to seat the pads against the rotor. Perform a bed-in procedure if recommended.',
        ],
      },
      {
        title: 'Brake Rotor Resurface or Replacement',
        difficulty: 'Intermediate',
        time: '60-90 min',
        tools: ['Lug wrench', 'Jack & stands', 'Socket set', 'Micrometer', 'Brake cleaner', 'Torque wrench'],
        torqueSpecs: [
          { part: 'Caliper bracket bolts', spec: '80-100 ft-lbs' },
          { part: 'Rotor set screw (if equipped)', spec: '5-8 ft-lbs' },
        ],
        steps: [
          'Follow steps 1-4 from the brake pad replacement procedure to remove the caliper.',
          'Remove the caliper bracket bolts and set the bracket aside. Support it to avoid stressing the brake hose.',
          'Remove the rotor retaining screw if equipped. If the rotor is seized, tap it with a rubber mlet around the hub area.',
          'Measure the rotor thickness with a micrometer. Compare to the minimum thickness spec stamped on the rotor hub.',
          'If resurfacing: take the rotor to a lathe. If replacing: install the new rotor.',
          'Clean the new or resurfaced rotor thoroughly with brake cleaner to remove the anti-corrosion coating.',
          'Install the rotor, set screw (if equipped), then reinstall the caliper bracket. Torque all bolts to specification.',
          'Install new brake pads, reinstall the caliper, and torque the caliper bolts to spec.',
          'Reinstall the wheel, lower the vehicle, torque lug nuts in a star pattern, and pump the brake pedal before driving.',
        ],
      },
      {
        title: 'Brake Fluid Flush & Bleed',
        difficulty: 'Beginner',
        time: '30-45 min',
        tools: ['Brake bleeder kit or clear tubing', 'Wrench (8mm or 10mm)', 'Brake fluid (DOT spec per manual)', 'Container for old fluid'],
        steps: [
          'Check the master cylinder and top up with fresh brake fluid of the correct DOT specification.',
          'Start with the wheel farthest from the master cylinder (typically right rear, then left rear, right front, left front).',
          'Attach a clear hose to the bleeder valve and submerge the other end in a container with some brake fluid.',
          'Have an assistant pump the brake pedal 3 times, then hold pressure. Open the bleeder valve to release fluid and air.',
          'Close the bleeder valve before the assistant releases the pedal. Repeat until clear fluid flows with no air bubbles.',
          'Check the master cylinder fluid level frequently. Never let it run dry or air will re-enter the system.',
          'Repeat for each wheel in the correct order. Dispose of old brake fluid properly.',
          'Verify a firm brake pedal. If still spongy, repeat the process or use a pressure bleeder.',
        ],
      },
    ],
  },
  {
    id: 'electrical',
    label: 'Electrical & Battery',
    icon: <Battery className="h-5 w-5" />,
    color: 'bg-yellow-50 text-yellow-600',
    procedures: [
      {
        title: 'Battery Testing & Replacement',
        difficulty: 'Beginner',
        time: '20-30 min',
        tools: ['Battery tester or multimeter', 'Socket set (5/16" or 10mm)', 'Battery terminal cleaner', 'Safety glasses'],
        steps: [
          'Wear safety glasses. Batteries contain sulfuric acid.',
          'Test the battery with a conductance tester or multimeter. A healthy battery reads 12.6V+ at rest.',
          'Perform a load test if the battery is more than 3 years old. Replace if it fails.',
          'Turn off the ignition and all electrical loads. Remove the negative (-) terminal first, then positive (+).',
          'Remove the battery hold-down bracket. Carefully lift the battery out — they can weigh 30-40 lbs.',
          'Clean the battery tray and cable terminals with a terminal cleaner brush.',
          'Install the new battery. Secure with the hold-down bracket.',
          'Connect the positive (+) terminal first, then negative (-). Coat terminals with anti-corrosion spray.',
          'Start the engine and verify charging voltage (13.8-14.4V) with a multimeter.',
        ],
      },
      {
        title: 'Alternator Diagnosis & Replacement',
        difficulty: 'Advanced',
        time: '60-120 min',
        tools: ['Multimeter', 'Socket set', 'Serpentine belt tool', 'Torque wrench', 'Battery terminal puller'],
        torqueSpecs: [
          { part: 'Alternator mounting bolts', spec: '30-40 ft-lbs' },
          { part: 'Alternator electrical connections', spec: '5-8 ft-lbs' },
        ],
        steps: [
          'Diagnose: Start the engine. Measure battery voltage with a multimeter. Should read 13.8-14.4V.',
          'If voltage is below 13.5V or above 14.8V, the alternator or voltage regulator may be faulty.',
          'Check the serpentine belt for proper tension and condition before condemning the alternator.',
          'Disconnect the negative battery cable before beginning replacement.',
          'Locate the alternator. Note the belt routing diagram (or take a photo) for reinstallation.',
          'Release tension on the serpentine belt tensioner and remove the belt from the alternator pulley.',
          'Disconnect the electrical connections at the alternator (main power wire and plug connector).',
          'Remove the alternator mounting bolts (usually 2-3). Remove the alternator from the vehicle.',
          'Install the new alternator. Torque mounting bolts to specification. Reconnect electrical connections.',
          'Reinstall the serpentine belt following the routing diagram. Verify proper tension.',
          'Reconnect the battery. Start the engine and verify charging voltage is within specification.',
        ],
      },
      {
        title: 'Starter Motor Diagnosis & Replacement',
        difficulty: 'Advanced',
        time: '60-90 min',
        tools: ['Multimeter', 'Socket set', 'Jack & stands (if underneath)', 'Torque wrench'],
        torqueSpecs: [
          { part: 'Starter mounting bolts', spec: '30-40 ft-lbs' },
          { part: 'Electrical connections', spec: '8-12 ft-lbs' },
        ],
        steps: [
          'Diagnose: Check battery voltage first. A weak battery mimics a bad starter.',
          'With the key in START position, check for voltage at the starter solenoid trigger wire.',
          'If voltage is present but starter does not engage, the starter is likely faulty.',
          'If no voltage at trigger wire, check the starter relay, ignition switch, and neutral safety switch.',
          'Disconnect the negative battery cable.',
          'Locate the starter (usually between the engine and transmission bellhousing).',
          'Remove the electrical connections from the starter (main power cable and trigger wire).',
          'Remove the starter mounting bolts (typically 2). The starter may be heavy — support it as you remove the last bolt.',
          'Compare the old and new starters to ensure correct fitment.',
          'Install the new starter. Torque mounting bolts to specification. Reconnect electrical connections and torque.',
          'Reconnect the battery. Test starting operation and verify no unusual noise.',
        ],
      },
    ],
  },
  {
    id: 'suspension',
    label: 'Suspension & Steering',
    icon: <ToolsIcon className="h-5 w-5" />,
    color: 'bg-green-50 text-green-600',
    procedures: [
      {
        title: 'Strut/Shock Absorber Replacement',
        difficulty: 'Advanced',
        time: '2-3 hours',
        tools: ['Strut spring compressor', 'Socket set', 'Torque wrench', 'Jack & stands', 'Breaker bar'],
        torqueSpecs: [
          { part: 'Strut top nut', spec: '30-40 ft-lbs' },
          { part: 'Strut-to-knuckle bolts', spec: '60-80 ft-lbs' },
          { part: 'Strut tower nuts', spec: '15-20 ft-lbs' },
        ],
        steps: [
          'Raise the vehicle and support with jack stands. Remove the wheel.',
          'Mark the position of the strut-to-knuckle bolts for alignment reference.',
          'Remove the lower strut mounting bolts from the steering knuckle.',
          'Under the hood, remove the strut tower nuts (usually 2-3). Support the strut from below as you remove the last nut.',
          'Remove the strut assembly from the vehicle.',
          'If reusing the spring: use a spring compressor to safely compress the coil spring. This is critical for safety.',
          'Remove the strut top hat nut. Disassemble the strut mount, bearing, and spring seat.',
          'Transfer the mount components to the new strut. Reinstall the top nut and torque to specification.',
          'Carefully release the spring compressor. Verify all components are seated correctly.',
          'Install the strut assembly into the vehicle. Torque the tower nuts, then the lower mounting bolts to specification.',
          'Reinstall the wheel, lower the vehicle, and torque lug nuts. Perform a wheel alignment after replacement.',
        ],
      },
      {
        title: 'Tie Rod End Replacement',
        difficulty: 'Intermediate',
        time: '45-60 min',
        tools: ['Tie rod puller or fork', 'Socket set', 'Torque wrench', 'Pliers', 'Jack & stands'],
        torqueSpecs: [
          { part: 'Tie rod end nut', spec: '35-45 ft-lbs' },
          { part: 'Jam nut (adjusting)', spec: 'Hand tight + 1/4 turn' },
        ],
        steps: [
          'Raise the vehicle and remove the wheel. Loosen the jam nut on the inner tie rod before removing anything.',
          'Count the exposed threads on the tie rod for approximate alignment reference during reassembly.',
          'Remove the cotter pin and castle nut from the outer tie rod end.',
          'Use a tie rod puller or pickle fork to separate the tie rod end from the steering knuckle.',
          'Unscrew the outer tie rod end from the inner tie rod. Keep the jam nut position reference.',
          'Install the new tie rod end, threading it to the same position as the old one for approximate alignment.',
          'Reconnect the tie rod end to the knuckle. Install the castle nut and torque to specification.',
          'Install a new cotter pin. If the hole does not align, tighten slightly (never loosen) until it does.',
          'Tighten the jam nut against the outer tie rod end.',
          'Reinstall the wheel, lower the vehicle, and torque lug nuts.',
          'A wheel alignment is required after tie rod replacement to prevent uneven tire wear.',
        ],
      },
    ],
  },
  {
    id: 'hvac',
    label: 'HVAC & A/C',
    icon: <Snowflake className="h-5 w-5" />,
    color: 'bg-cyan-50 text-cyan-600',
    procedures: [
      {
        title: 'A/C System Diagnosis & Recharge',
        difficulty: 'Intermediate',
        time: '45-60 min',
        tools: ['A/C manifold gauge set', 'Refrigerant (R-134a or R-1234yf)', 'Vacuum pump', 'Leak detector', 'Safety glasses'],
        steps: [
          'Connect the manifold gauge set to both the high and low side service ports.',
          'Record the static pressure readings with the engine off. Both sides should read equal (ambient temp dependent).',
          'Start the engine and set A/C to MAX with the blower on high. Wait 5 minutes for the system to stabilize.',
          'Compare gauge readings to specifications. Normal operating pressures: Low 25-40 psi, High 200-250 psi (varies by ambient).',
          'If low side is low and high side is low: system is low on charge. Check for leaks.',
          'If low side is low and high side is high: possible restriction in the system (expansion valve or orifice tube).',
          'If low side is high and high side is high: possible overcharge or air in system, or weak condenser fan.',
          'If low side fluctuates and high side fluctuates: possible moisture in the system (pump down and recharge).',
          'To recharge: recover the old refrigerant, pull a vacuum for 30+ minutes, then charge with the specified amount by weight.',
          'Verify proper vent temperature (typically 35-45°F at the center vent on MAX A/C).',
        ],
      },
      {
        title: 'Cabin Air Filter Replacement',
        difficulty: 'Beginner',
        time: '10-15 min',
        tools: ['None typically required — possibly a trim tool or socket'],
        steps: [
          'Locate the cabin air filter housing. Common locations: behind the glove box, under the dashboard on the passenger side, or under the hood near the cowl.',
          'If behind the glove box: open the glove box, remove the limiting stop arm, then squeeze the sides to drop the box down.',
          'Remove the filter housing cover — usually it has tabs that squeeze or slide to release.',
          'Note the airflow direction arrow on the old filter. This is critical for proper installation.',
          'Remove the old filter. Inspect for debris, leaves, or odor. A severely clogged filter can reduce airflow and cause A/C issues.',
          'Clean any debris from the housing with a vacuum if necessary.',
          'Install the new filter with the airflow arrow pointing in the same direction as the old one.',
          'Replace the housing cover and reinstall the glove box.',
          'Recommend replacement every 12,000-15,000 miles or at least once a year.',
        ],
      },
    ],
  },
  {
    id: 'diagnostics',
    label: 'Diagnostics & OBD-II',
    icon: <Gauge className="h-5 w-5" />,
    color: 'bg-purple-50 text-purple-600',
    procedures: [
      {
        title: 'OBD-II Code Reading & Basic Diagnosis',
        difficulty: 'Beginner',
        time: '15-30 min',
        tools: ['OBD-II scanner', 'Notepad or app for code storage', 'Vehicle service manual or code database'],
        steps: [
          'Locate the OBD-II diagnostic connector. It is always within 2 feet of the steering column, under the dash.',
          'Plug in the OBD-II scanner with the key in the OFF position.',
          'Turn the key to the ON position (engine off). Wait for the scanner to initialize.',
          'Read and record all stored Diagnostic Trouble Codes (DTCs) and freeze frame data.',
          'Note pending codes separately from confirmed codes. Pending codes indicate intermittent issues.',
          'Look up each code in a service manual or reliable database. Common code prefixes:',
          '  P0xxx = Powertrain (emission-related), P1xxx = Manufacturer-specific powertrain',
          '  P02xx-03xx = Fuel/air metering, P03xx = Ignition system, P04xx = Auxiliary emissions',
          '  P05xx = Vehicle speed control, P07xx-08xx = Transmission',
          'Clear the codes and take the vehicle for a test drive to see which codes return.',
          'Diagnose the root cause, not just the symptom. A P0171 (lean) could be a vacuum leak, MAF sensor, or fuel pump issue.',
          'After repair, clear codes and verify they do not return after a complete drive cycle.',
        ],
      },
      {
        title: 'Misfire Diagnosis (P0300-P0312)',
        difficulty: 'Intermediate',
        time: '30-60 min',
        tools: ['OBD-II scanner', 'Spark plug socket', 'Multimeter', 'Noid light (optional)', 'Compression tester'],
        steps: [
          'Read the DTC to identify which cylinder(s) are misfiring. P0301 = cylinder 1, P0304 = cylinder 4, etc.',
          'If random misfire (P0300), check for vacuum leaks, fuel pressure issues, or worn spark plugs across all cylinders.',
          'If specific cylinder, perform a component swap test: move the ignition coil from the misfiring cylinder to a known-good cylinder.',
          'Clear codes and test drive. If the misfire follows the coil, the coil is faulty. If it stays on the same cylinder, investigate further.',
          'Perform the same swap test with the spark plug if the coil swap did not move the misfire.',
          'If the misfire persists on the same cylinder after coil and plug swap, check fuel injector operation with a noid light.',
          'If the injector is pulsing, perform a compression test on the misfiring cylinder. Compare to other cylinders (should be within 10%).',
          'Low compression indicates a mechanical issue: worn piston rings, leaking valves, or blown head gasket.',
          'Common causes by frequency: 1) Spark plug/coil, 2) Fuel injector, 3) Vacuum leak, 4) Mechanical (compression).',
          'After repair, clear codes and verify smooth idle and no misfire codes after a complete drive cycle.',
        ],
      },
    ],
  },
];

const MAKES = ['Toyota', 'Honda', 'Ford', 'Chevrolet', 'Nissan', 'BMW', 'Mercedes-Benz', 'Volkswagen', 'Hyundai', 'Kia', 'Mazda', 'Subaru', 'Jeep', 'Ram', 'GMC', 'Audi', 'Lexus', 'Acura', 'Volvo', 'Other'];
const YEARS = Array.from({ length: 25 }, (_, i) => 2025 - i);

export function RepairGuidesPage() {
  const { shop } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProcedure, setSelectedProcedure] = useState<GuideProcedure | null>(null);
  const [filterMake, setFilterMake] = useState('');
  const [filterYear, setFilterYear] = useState('');

  useEffect(() => {
    if (shop) loadVehicles();
  }, [shop]);

  async function loadVehicles() {
    if (!shop) return;
    const { data } = await supabase.from('vehicles').select('*').eq('shop_id', shop.id).limit(50);
    setVehicles((data as Vehicle[]) ?? []);
  }

  const filteredProcedures = useMemo(() => {
    if (!selectedCategory) return [];
    const cat = GUIDE_CATEGORIES.find((c) => c.id === selectedCategory);
    if (!cat) return [];
    if (!searchQuery) return cat.procedures;
    return cat.procedures.filter((p) => p.title.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [selectedCategory, searchQuery]);

  const difficultyColors: Record<string, string> = {
    Beginner: 'bg-green-100 text-green-700',
    Intermediate: 'bg-yellow-100 text-yellow-700',
    Advanced: 'bg-red-100 text-red-700',
  };

  return (
    <div className="space-y-4 p-4 lg:p-6">
      {/* Header with ALLDATA branding context */}
      <div className="rounded-xl bg-gradient-to-r from-[#1a2234] to-[#2a3650] p-5 text-white">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-blue-400" />
              <h2 className="text-xl font-bold">Repair Guides</h2>
            </div>
            <p className="mt-1 text-sm text-gray-300">OEM repair procedures, torque specs, and diagnostic guides for your shop</p>
          </div>
          <div className="rounded-lg bg-white/10 px-3 py-1.5 text-xs">
            Powered by ALLDATA<span className="text-blue-400"> Connect</span>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-yellow-400/15 px-3 py-2 text-xs text-yellow-200">
          <Info className="h-4 w-4 shrink-0" />
          <span>Demonstration mode with built-in guide content. Connect your ALLDATA subscription in Settings to access full OEM service data for all vehicles.</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: Category + vehicle selection */}
        <div className="lg:col-span-1 space-y-4">
          {/* Vehicle filter */}
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
              <Car className="h-4 w-4 text-gray-400" /> Vehicle Filter
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs text-gray-500">Make</label>
                <select value={filterMake} onChange={(e) => setFilterMake(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none">
                  <option value="">All Makes</option>
                  {MAKES.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">Year</label>
                <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none">
                  <option value="">All Years</option>
                  {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
            {vehicles.length > 0 && (
              <div className="mt-3 space-y-1">
                <p className="text-xs text-gray-400">Or pick from shop vehicles:</p>
                {vehicles.slice(0, 5).map((v) => (
                  <button key={v.id} onClick={() => { setFilterMake(v.make); setFilterYear(v.year ? String(v.year) : ''); }}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs text-gray-600 hover:bg-blue-50 transition-colors">
                    <Car className="h-3 w-3 text-gray-400" />
                    {vehicleLabel(v)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Categories */}
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <h3 className="mb-3 text-sm font-semibold text-gray-900">Service Categories</h3>
            <div className="space-y-1">
              {GUIDE_CATEGORIES.map((cat) => (
                <button key={cat.id} onClick={() => { setSelectedCategory(cat.id); setSelectedProcedure(null); }}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    selectedCategory === cat.id ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
                  }`}>
                  <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${cat.color}`}>{cat.icon}</span>
                  <span className="flex-1 text-left">{cat.label}</span>
                  <span className="text-xs text-gray-400">{cat.procedures.length}</span>
                  <ChevronRight className="h-4 w-4 text-gray-300" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Procedures list or detail */}
        <div className="lg:col-span-2">
          {!selectedCategory ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-20 text-center">
              <BookOpen className="mb-3 h-12 w-12 text-gray-200" />
              <h3 className="text-lg font-semibold text-gray-900">Select a Category</h3>
              <p className="mt-1 max-w-sm text-sm text-gray-500">Choose a service category from the left to browse repair procedures, torque specs, and step-by-step guides.</p>
            </div>
          ) : !selectedProcedure ? (
            <div className="space-y-3">
              {/* Search within category */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search procedures..."
                  className="w-full rounded-lg border border-gray-300 pl-10 pr-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" />
              </div>

              {filterMake && (
                <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700">
                  <Car className="h-4 w-4" />
                  Showing guides for: {filterYear} {filterMake}
                  <button onClick={() => { setFilterMake(''); setFilterYear(''); }} className="ml-auto text-xs text-blue-600 hover:underline">Clear</button>
                </div>
              )}

              {filteredProcedures.length === 0 ? (
                <div className="rounded-xl border border-gray-200 bg-white py-12 text-center">
                  <p className="text-sm text-gray-500">No procedures found matching your search.</p>
                </div>
              ) : (
                filteredProcedures.map((proc, i) => (
                  <button key={i} onClick={() => setSelectedProcedure(proc)}
                    className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white p-4 text-left hover:border-blue-300 hover:shadow-sm transition-all">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                        <Wrench className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{proc.title}</p>
                        <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                          <span className={`rounded-full px-2 py-0.5 font-medium ${difficultyColors[proc.difficulty]}`}>{proc.difficulty}</span>
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{proc.time}</span>
                          <span className="flex items-center gap-1"><ToolsIcon className="h-3 w-3" />{proc.tools.length} tools</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-300" />
                  </button>
                ))
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              {/* Procedure header */}
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <button onClick={() => setSelectedProcedure(null)}
                    className="mb-2 flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700">
                    <ChevronRight className="h-3 w-3 rotate-180" /> Back to list
                  </button>
                  <h2 className="text-xl font-bold text-gray-900">{selectedProcedure.title}</h2>
                  <div className="mt-2 flex items-center gap-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${difficultyColors[selectedProcedure.difficulty]}`}>
                      {selectedProcedure.difficulty}
                    </span>
                    <span className="flex items-center gap-1 text-sm text-gray-500">
                      <Clock className="h-3.5 w-3.5" />{selectedProcedure.time}
                    </span>
                  </div>
                </div>
              </div>

              {filterMake && (
                <div className="mb-4 flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700">
                  <Car className="h-4 w-4" /> Applied to: {filterYear} {filterMake}
                </div>
              )}

              {/* Tools required */}
              <div className="mb-5 rounded-lg bg-gray-50 p-4">
                <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <ToolsIcon className="h-4 w-4 text-gray-400" /> Tools Required
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedProcedure.tools.map((tool, i) => (
                    <span key={i} className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs text-gray-700">{tool}</span>
                  ))}
                </div>
              </div>

              {/* Torque specs */}
              {selectedProcedure.torqueSpecs && selectedProcedure.torqueSpecs.length > 0 && (
                <div className="mb-5 rounded-lg bg-orange-50 p-4">
                  <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <Gauge className="h-4 w-4 text-orange-500" /> Torque Specifications
                  </h3>
                  <div className="space-y-1">
                    {selectedProcedure.torqueSpecs.map((spec, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">{spec.part}</span>
                        <span className="font-mono font-semibold text-orange-700">{spec.spec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Steps */}
              <div>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <Wrench className="h-4 w-4 text-gray-400" /> Procedure
                </h3>
                <div className="space-y-3">
                  {selectedProcedure.steps.map((step, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                        {i + 1}
                      </div>
                      <p className="pt-0.5 text-sm text-gray-700">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Safety notice */}
              <div className="mt-6 flex items-start gap-2 rounded-lg bg-yellow-50 p-3 text-xs text-yellow-800">
                <CircleAlert className="h-4 w-4 shrink-0 text-yellow-600" />
                <span>Always consult the vehicle's specific OEM service manual for exact torque values, procedures, and safety requirements. These guides are for general reference. Torque specs may vary by engine and model year.</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
