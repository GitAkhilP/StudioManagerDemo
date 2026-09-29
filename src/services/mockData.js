/**
 * Format a date relative to today for mock booking schedules.
 *
 * @param {number} days Number of days to add to the current date.
 * @returns {string} Date string in YYYY-MM-DD format.
 */
function dateOffset(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Seed data used by localStorage-backed services on first load.
 */
export const MOCK_DATA = {
  inventory: [
    {
      id: "inv_001",
      name: "Car Wash Soap (Gallon)",
      quantity: 15,
      price: 24.99,
      description: "Professional grade pH-neutral car wash soap concentrate",
      createdAt: "2025-01-01T00:00:00.000Z",
    },
    {
      id: "inv_002",
      name: "Microfiber Towels (Pack of 12)",
      quantity: 8,
      price: 19.99,
      description: "Premium 400 GSM microfiber towels for washing and drying",
      createdAt: "2025-01-01T00:00:00.000Z",
    },
    {
      id: "inv_003",
      name: "Clay Bar Kit",
      quantity: 6,
      price: 32.5,
      description: "Professional clay bar system for paint decontamination",
      createdAt: "2025-01-01T00:00:00.000Z",
    },
    {
      id: "inv_004",
      name: "Ceramic Coating (50ml)",
      quantity: 4,
      price: 89.99,
      description: "9H hardness nano ceramic coating with 2-year protection",
      createdAt: "2025-01-01T00:00:00.000Z",
    },
    {
      id: "inv_005",
      name: "Tire Shine Spray",
      quantity: 12,
      price: 15.99,
      description: "Water-based tire shine for long-lasting gloss",
      createdAt: "2025-01-01T00:00:00.000Z",
    },
    {
      id: "inv_006",
      name: "Pressure Washer Foam Cannon",
      quantity: 3,
      price: 45.99,
      description: "Adjustable foam cannon attachment for pressure washers",
      createdAt: "2025-01-02T00:00:00.000Z",
    },
    {
      id: "inv_007",
      name: "Glass Cleaner (32oz)",
      quantity: 10,
      price: 12.99,
      description: "Streak-free ammonia-free glass and mirror cleaner",
      createdAt: "2025-01-02T00:00:00.000Z",
    },
    {
      id: "inv_008",
      name: "Interior Detailing Brushes Set",
      quantity: 7,
      price: 28.99,
      description: "5-piece brush set for vents and upholstery",
      createdAt: "2025-01-03T00:00:00.000Z",
    },
    {
      id: "inv_009",
      name: "Leather Conditioner",
      quantity: 9,
      price: 22.99,
      description: "UV protection leather conditioner and moisturizer",
      createdAt: "2025-01-03T00:00:00.000Z",
    },
    {
      id: "inv_010",
      name: "All-Purpose Cleaner (Gallon)",
      quantity: 6,
      price: 18.99,
      description: "Concentrated degreaser safe for all surfaces",
      createdAt: "2025-01-04T00:00:00.000Z",
    },
    {
      id: "inv_011",
      name: "Wax Applicator Pads (Pack of 6)",
      quantity: 14,
      price: 8.99,
      description: "Foam applicator pads for wax and polish application",
      createdAt: "2025-01-04T00:00:00.000Z",
    },
    {
      id: "inv_012",
      name: "Wheel Cleaner",
      quantity: 8,
      price: 16.99,
      description: "Acid-free wheel cleaner safe for all wheels",
      createdAt: "2025-01-04T00:00:00.000Z",
    },
    {
      id: "inv_013",
      name: "Engine Bay Degreaser",
      quantity: 5,
      price: 17.99,
      description: "Safe degreaser for engine bay cleaning",
      createdAt: "2025-01-05T00:00:00.000Z",
    },
    {
      id: "inv_014",
      name: "Odor Eliminator Spray",
      quantity: 9,
      price: 14.49,
      description: "Enzyme-based odor eliminator for interiors",
      createdAt: "2025-01-05T00:00:00.000Z",
    },
    {
      id: "inv_015",
      name: "Upholstery Cleaner",
      quantity: 7,
      price: 21.99,
      description: "Foaming cleaner for cloth and fabric surfaces",
      createdAt: "2025-01-06T00:00:00.000Z",
    },
    {
      id: "inv_016",
      name: "Detailing Clay Lube",
      quantity: 11,
      price: 13.99,
      description: "Clay bar lubricant spray",
      createdAt: "2025-01-06T00:00:00.000Z",
    },
    {
      id: "inv_017",
      name: "Plastic & Trim Restorer",
      quantity: 4,
      price: 19.49,
      description: "Restores faded trim to deep black",
      createdAt: "2025-01-07T00:00:00.000Z",
    },
    {
      id: "inv_018",
      name: "Interior Protectant (Matte Finish)",
      quantity: 10,
      price: 16.49,
      description: "UV protective matte finish interior cleaner",
      createdAt: "2025-01-07T00:00:00.000Z",
    },
  ],

  users: [
    {
      id: "user_001",
      username: "adminDude",
      email: "admin@studio.local",
      password: "admin123!!",
      role: "admin",
      status: "active",
      createdAt: "2025-01-01T09:00:00.000Z",
    },
    {
      id: "user_003",
      username: "frontDeskAmy",
      email: "amy@studio.local",
      password: "frontDesk1!",
      role: "employee",
      employeeType: "supervisor",
      status: "active",
      createdAt: "2025-01-03T11:00:00.000Z",
    },
    {
      id: "user_004",
      username: "detailTechMax",
      email: "max@studio.local",
      password: "detailMax!",
      role: "employee",
      employeeType: "basic",
      status: "active",
      createdAt: "2025-01-03T14:15:00.000Z",
    },
    {
      id: "user_005",
      username: "memberJordan",
      email: "jordan@studio.local",
      password: "memberJordan1!",
      role: "member",
      status: "active",
      createdAt: "2025-01-04T10:00:00.000Z",
    },
  ],

  sales: [
    {
      id: "sale_001",
      userId: "user_005",
      amount: 145,
      description: "Signature Detail service",
      items: ["Signature Detail"],
      createdAt: new Date(Date.now() - 9 * 86400000).toISOString(),
    },
    {
      id: "sale_002",
      userId: "user_005",
      amount: 44.98,
      description: "Member shop order",
      items: ["Car Wash Soap (Gallon)", "Microfiber Towels (Pack of 12)"],
      createdAt: new Date(Date.now() - 6 * 86400000).toISOString(),
    },
    {
      id: "sale_003",
      userId: "user_005",
      amount: 59,
      description: "Express Detail service package",
      items: ["Express Detail"],
      createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
    {
      id: "sale_004",
      userId: "user_005",
      amount: 73.47,
      description: "Member shop order",
      items: ["Wheel Cleaner", "Tire Shine Spray", "Wax Applicator Pads"],
      createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
  ],

  checkins: [
    {
      id: "chk_001",
      userId: "user_005",
      createdAt: new Date(Date.now() - 12 * 86400000).toISOString(),
    },
    {
      id: "chk_002",
      userId: "user_005",
      createdAt: new Date(Date.now() - 9 * 86400000).toISOString(),
    },
    {
      id: "chk_003",
      userId: "user_005",
      createdAt: new Date(Date.now() - 6 * 86400000).toISOString(),
    },
    {
      id: "chk_004",
      userId: "user_005",
      createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
  ],

  bookingServices: [
    {
      id: "express",
      name: "Express Wash",
      price: 45,
      duration: "45 min",
      description: "Foam wash, wheels, glass, and quick cabin reset.",
    },
    {
      id: "signature",
      name: "Signature Detail",
      price: 145,
      duration: "2 hr",
      description:
        "Exterior hand wash, clay towel, interior steam, and trim care.",
    },
    {
      id: "ceramic",
      name: "Ceramic Boost",
      price: 260,
      duration: "3.5 hr",
      description:
        "Paint prep, gloss enhancer, ceramic spray sealant, and cure check.",
    },
  ],

  bookingDropoffWindows: [
    "Morning drop-off",
    "Afternoon drop-off",
    "Wait at studio",
    "After-hours key drop",
  ],

  bookings: [
    {
      id: "booking_1187",
      userId: "user_005",
      serviceId: "signature",
      serviceName: "Signature Detail",
      vehicle: "2022 Honda Accord",
      date: dateOffset(4),
      time: "10:30",
      status: "Confirmed",
      bay: "Detail Bay 2",
      advisor: "Maya",
      notes: "Focus on rear floor mats and cup holders.",
      createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    },
    {
      id: "booking_1191",
      userId: "user_005",
      serviceId: "ceramic",
      serviceName: "Ceramic Boost",
      vehicle: "2024 Tesla Model Y",
      date: dateOffset(11),
      time: "13:00",
      status: "Requested",
      bay: "Pending bay assignment",
      advisor: "Studio desk",
      notes: "Customer prefers a late pickup window.",
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    {
      id: "booking_0914",
      userId: "user_005",
      serviceId: "interior",
      serviceName: "Interior Refresh",
      vehicle: "2021 Subaru Outback",
      date: dateOffset(-16),
      time: "09:00",
      status: "Completed",
      bay: "Detail Bay 1",
      advisor: "Maya",
      notes: "Pet hair removal and leather conditioning completed.",
      createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    },
    {
      id: "booking_0872",
      userId: "user_005",
      serviceId: "express",
      serviceName: "Express Wash",
      vehicle: "2022 Honda Accord",
      date: dateOffset(-38),
      time: "15:30",
      status: "Completed",
      bay: "Wash Bay",
      advisor: "Studio desk",
      notes: "Maintenance wash with tire dressing.",
      createdAt: new Date(Date.now() - 42 * 86400000).toISOString(),
    },
    {
      id: "booking_0843",
      userId: "user_005",
      serviceId: "paint-check",
      serviceName: "Paint Check",
      vehicle: "2024 Tesla Model Y",
      date: dateOffset(-55),
      time: "12:00",
      status: "Canceled",
      bay: "Canceled before assignment",
      advisor: "Studio desk",
      notes: "Canceled before confirmation.",
      createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
    },
    {
      id: "booking_2201",
      userId: "user_005",
      serviceId: "express",
      serviceName: "Express Wash",
      vehicle: "2020 Ford F-150",
      date: dateOffset(2),
      time: "08:30",
      status: "Confirmed",
      bay: "Wash Bay",
      advisor: "Lena",
      notes: "Quick wash before weekend pickup.",
      createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
    {
      id: "booking_2202",
      userId: "user_005",
      serviceId: "signature",
      serviceName: "Signature Detail",
      vehicle: "2019 BMW 330i",
      date: dateOffset(-9),
      time: "11:00",
      status: "Completed",
      bay: "Detail Bay 3",
      advisor: "Lena",
      notes: "Finished with interior protectant and glass polish.",
      createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
    },
  ],

  supportChannels: [
    {
      title: "Studio desk",
      detail: "(410) 555-0198",
      meta: "8:00 AM - 6:00 PM",
      badge: "Live",
    },
    {
      title: "Member care",
      detail: "support@studiomanager.local",
      meta: "Replies under 2 hours",
      badge: "Email",
    },
    {
      title: "After-hours line",
      detail: "(410) 555-0184",
      meta: "Urgent booking changes",
      badge: "Priority",
    },
  ],

  supportCategories: [
    "Booking",
    "Billing",
    "Vehicle care",
    "Products",
    "Membership",
  ],

  supportContactMethods: ["Email", "Phone", "Text"],

  supportPriorities: ["Standard", "Time-sensitive", "Urgent"],

  supportStatus: [
    {
      label: "Support queue",
      value: "Normal",
      detail: "Average reply under 2 hours",
      state: "good",
    },
    {
      label: "Booking changes",
      value: "Open",
      detail: "Same-day changes reviewed by desk staff",
      state: "watch",
    },
    {
      label: "Product orders",
      value: "On track",
      detail: "Pickup shelves restocked this morning",
      state: "good",
    },
  ],

  supportFaqs: [
    {
      question: "Can I change a detailing appointment?",
      answer:
        "Yes. Include the current booking date, vehicle, and two preferred windows.",
    },
    {
      question: "When should I report vehicle notes?",
      answer:
        "Send notes before arrival for paint concerns, pet hair, odor treatment, or aftermarket parts.",
    },
    {
      question: "How are membership billing issues handled?",
      answer:
        "Billing requests are reviewed by the studio manager and usually close within one business day.",
    },
  ],

  supportRequests: [
    {
      id: "REQ-1048",
      userId: "user_005",
      title: "Add ceramic coating to Friday booking",
      category: "Booking",
      priority: "Standard",
      vehicle: "2024 Tesla Model Y",
      contact: "Email",
      details: "Please add ceramic coating if there is bay time available.",
      status: "In review",
      updated: "24 min ago",
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    {
      id: "REQ-1039",
      userId: "user_005",
      title: "Update card for monthly membership",
      category: "Billing",
      priority: "Standard",
      vehicle: "",
      contact: "Email",
      details: "I need to update the card on my membership.",
      status: "Waiting on member",
      updated: "Yesterday",
      createdAt: new Date(Date.now() - 8 * 86400000).toISOString(),
    },
    {
      id: "REQ-1027",
      userId: "user_005",
      title: "Question about leather conditioner",
      category: "Products",
      priority: "Standard",
      vehicle: "2022 Honda Accord",
      contact: "Email",
      details: "Which conditioner should I use between visits?",
      status: "Solved",
      updated: "May 18",
      createdAt: new Date(Date.now() - 18 * 86400000).toISOString(),
    },
    {
      id: "REQ-2052",
      userId: "user_005",
      title: "Move truck wash earlier",
      category: "Booking",
      priority: "Time-sensitive",
      vehicle: "2020 Ford F-150",
      contact: "Text",
      details: "Can the truck wash happen before 9 AM?",
      status: "In review",
      updated: "1 hour ago",
      createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
  ],

  shopProducts: [
    {
      id: "shop_fallback_wash",
      name: "Premium Wash Kit",
      description: "pH-neutral wash soap, mitt, drying towel, and wheel brush.",
      quantity: 8,
      price: 49.99,
    },
    {
      id: "shop_fallback_interior",
      name: "Interior Refresh Bundle",
      description: "Cleaner, detailing brushes, glass cloth, and leather care.",
      quantity: 6,
      price: 64.99,
    },
    {
      id: "shop_fallback_protect",
      name: "Paint Protection Starter",
      description: "Clay bar, polish applicators, spray sealant, and towel set.",
      quantity: 4,
      price: 79.99,
    },
    {
      id: "shop_fallback_tires",
      name: "Wheel and Tire Finish Kit",
      description: "Acid-free wheel cleaner, tire shine, and applicator pads.",
      quantity: 10,
      price: 39.99,
    },
  ],

  shopServicePackages: [
    {
      id: "express-detail",
      name: "Express Detail",
      duration: "45 min",
      price: 59,
      description:
        "Exterior hand wash, wheels, windows, and quick interior wipe.",
    },
    {
      id: "interior-reset",
      name: "Interior Reset",
      duration: "90 min",
      price: 129,
      description:
        "Vacuum, steam touchpoints, carpets, mats, vents, and glass.",
    },
    {
      id: "ceramic-consult",
      name: "Ceramic Consult",
      duration: "30 min",
      price: 25,
      description: "Paint inspection and quote for coating or correction work.",
    },
  ],

  memberQuickActions: [
    { label: "Book detail", to: "/member/bookings", glyph: "+" },
    { label: "Shop supplies", to: "/member/shop", glyph: "$" },
    { label: "Get support", to: "/member/support", glyph: "?" },
    { label: "Edit account", to: "/member/account", glyph: ">" },
  ],

  memberPreferences: {
    emailReminders: true,
    smsReminders: false,
    serviceUpdates: true,
    promotions: false,
  },
};
