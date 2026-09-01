import { Category, Alias } from "../types";

export interface StaticAlias {
  alias: string;
  normalizedValue: string;
  categoryId: string;
}

export const CATEGORIES: Category[] = [
  {
    id: "1",
    name: "21st Century Skills",
    slug: "21st-century-skills",
    description: "Essential modern workplace competencies including digital collaboration, critical thinking, communication, and environmental literacy."
  },
  {
    id: "2",
    name: "Agriculture",
    slug: "agriculture",
    description: "Crop production, farming methods, animal husbandry, aquaculture, agricultural mechanization, and organic farming."
  },
  {
    id: "3",
    name: "Automotive and Land Transport",
    slug: "automotive-and-land-transport",
    description: "Automotive servicing, vehicle maintenance, motorcycle repair, engine troubleshooting, and driving operations."
  },
  {
    id: "4",
    name: "Construction",
    slug: "construction",
    description: "Carpentry, masonry, plumbing, tile setting, civil works, metal fabrication, welding, and building maintenance."
  },
  {
    id: "5",
    name: "Electrical and Electronics",
    slug: "electrical-and-electronics",
    description: "Electrical installation and maintenance, building wiring, electronic products assembly, and appliance servicing."
  },
  {
    id: "6",
    name: "Entrepreneurship",
    slug: "entrepreneurship",
    description: "Small business management, bookkeeping, franchising, online selling, and micro-enterprise development."
  },
  {
    id: "7",
    name: "Gender and Development (GAD)",
    slug: "gender-and-development-gad",
    description: "Gender sensitivity training, workplace equality, rights-based development, and inclusive community practices."
  },
  {
    id: "8",
    name: "Halal Awareness Program",
    slug: "halal-awareness-program",
    description: "Halal standards, Islamic compliance guidelines, food handling, and assurance systems."
  },
  {
    id: "9",
    name: "Heating, Ventilating, Airconditioning and Refrigeration Technology",
    slug: "heating-ventilating-airconditioning-and-refrigeration-technology",
    description: "HVAC/R installation, servicing, commercial refrigeration, and climate control maintenance."
  },
  {
    id: "10",
    name: "Human Health/ Health Care",
    slug: "human-health-health-care",
    description: "Caregiving, healthcare services, nursing assistance, patient support, and emergency medical response."
  },
  {
    id: "11",
    name: "Information and Communication Technology",
    slug: "information-and-communication-technology",
    description: "Computer systems servicing, programming, web development, networking, database management, and digital technologies."
  },
  {
    id: "12",
    name: "Language",
    slug: "language",
    description: "Foreign language proficiency, workplace English communication, Nihongo, and conversational skills."
  },
  {
    id: "13",
    name: "Lifelong Learning Skills",
    slug: "lifelong-learning-skills",
    description: "Personal effectiveness, career development, foundational learning skills, and self-management."
  },
  {
    id: "14",
    name: "Maritime",
    slug: "maritime",
    description: "Seafaring, deck operations, engine watchkeeping, marine safety, and maritime navigational support."
  },
  {
    id: "15",
    name: "Process Food and Beverages",
    slug: "process-food-and-beverages",
    description: "Commercial cooking, baking and pastry production, food preservation, processing, and culinary arts."
  },
  {
    id: "16",
    name: "Social, Community Development and Others",
    slug: "social-community-development-and-others",
    description: "Barangay governance, community leadership, social development, and civic service."
  },
  {
    id: "17",
    name: "Tourism",
    slug: "tourism",
    description: "Hotel operations, front office services, housekeeping, tour guiding, travel agency services, and hospitality."
  },
  {
    id: "18",
    name: "TVET",
    slug: "tvet",
    description: "Technical vocational education and training methodologies, trainer qualifications (TM I/II), and instructional development."
  },
  {
    id: "19",
    name: "TOP Courses with Accessibility Features",
    slug: "top-courses-with-accessibility-features",
    description: "TESDA Online Program courses specially designed with accessibility features for learners with disabilities."
  },
  {
    id: "20",
    name: "International Labour Organization (ILO) Online Courses",
    slug: "international-labour-organization-ilo-online-courses",
    description: "International labor standards, occupational safety and health, rights at work, and decent work principles."
  }
];

export const CATEGORY_MAP: Record<string, Category> = CATEGORIES.reduce((acc, cat) => {
  acc[cat.id] = cat;
  return acc;
}, {} as Record<string, Category>);

export const CATEGORY_SLUG_MAP: Record<string, Category> = CATEGORIES.reduce((acc, cat) => {
  acc[cat.slug] = cat;
  return acc;
}, {} as Record<string, Category>);

export const INITIAL_ALIASES: StaticAlias[] = [
  // =========================================================================
  // 11: Information and Communication Technology (ICT)
  // =========================================================================
  { alias: "computer", normalizedValue: "Computer", categoryId: "11" },
  { alias: "computers", normalizedValue: "Computer", categoryId: "11" },
  { alias: "computer literacy", normalizedValue: "Computer", categoryId: "11" },
  { alias: "basic computer", normalizedValue: "Computer", categoryId: "11" },
  { alias: "computer operations", normalizedValue: "Computer", categoryId: "11" },
  { alias: "programming", normalizedValue: "Programming", categoryId: "11" },
  { alias: "coding", normalizedValue: "Programming", categoryId: "11" },
  { alias: "software", normalizedValue: "Programming", categoryId: "11" },
  { alias: "software development", normalizedValue: "Programming", categoryId: "11" },
  { alias: "software developer", normalizedValue: "Programming", categoryId: "11" },
  { alias: "web development", normalizedValue: "Web Development", categoryId: "11" },
  { alias: "web developer", normalizedValue: "Web Development", categoryId: "11" },
  { alias: "web design", normalizedValue: "Web Design", categoryId: "11" },
  { alias: "website design", normalizedValue: "Web Design", categoryId: "11" },
  { alias: "graphic design", normalizedValue: "Graphic Design", categoryId: "11" },
  { alias: "digital arts", normalizedValue: "Graphic Design", categoryId: "11" },
  { alias: "photoshop", normalizedValue: "Graphic Design", categoryId: "11" },
  { alias: "computer repair", normalizedValue: "Computer Systems Servicing", categoryId: "11" },
  { alias: "computer technician", normalizedValue: "Computer Systems Servicing", categoryId: "11" },
  { alias: "computer systems servicing", normalizedValue: "Computer Systems Servicing", categoryId: "11" },
  { alias: "css nc ii", normalizedValue: "Computer Systems Servicing", categoryId: "11" },
  { alias: "pc assembly", normalizedValue: "Computer Systems Servicing", categoryId: "11" },
  { alias: "it", normalizedValue: "Information Technology", categoryId: "11" },
  { alias: "ict", normalizedValue: "Information Technology", categoryId: "11" },
  { alias: "information technology", normalizedValue: "Information Technology", categoryId: "11" },
  { alias: "information and communication technology", normalizedValue: "Information Technology", categoryId: "11" },
  { alias: "technology", normalizedValue: "Information Technology", categoryId: "11" },
  { alias: "tech", normalizedValue: "Information Technology", categoryId: "11" },
  { alias: "it support", normalizedValue: "IT Support", categoryId: "11" },
  { alias: "technical support", normalizedValue: "IT Support", categoryId: "11" },
  { alias: "helpdesk", normalizedValue: "IT Support", categoryId: "11" },
  { alias: "computer shop helper", normalizedValue: "Computer Shop Helper", categoryId: "11" },
  { alias: "computer shop assistant", normalizedValue: "Computer Shop Helper", categoryId: "11" },
  { alias: "pisonet attendant", normalizedValue: "Computer Shop Helper", categoryId: "11" },
  { alias: "data entry", normalizedValue: "Data Entry", categoryId: "11" },
  { alias: "typing", normalizedValue: "Data Entry", categoryId: "11" },
  { alias: "ms office", normalizedValue: "Office Productivity", categoryId: "11" },
  { alias: "microsoft excel", normalizedValue: "Office Productivity", categoryId: "11" },
  { alias: "excel", normalizedValue: "Office Productivity", categoryId: "11" },
  { alias: "networking", normalizedValue: "Computer Networking", categoryId: "11" },
  { alias: "network technician", normalizedValue: "Computer Networking", categoryId: "11" },
  { alias: "lan cabling", normalizedValue: "Computer Networking", categoryId: "11" },
  { alias: "it professional", normalizedValue: "IT Professional", categoryId: "11" },
  { alias: "become an it professional", normalizedValue: "IT Professional", categoryId: "11" },

  // =========================================================================
  // 15: Process Food and Beverages
  // =========================================================================
  { alias: "cooking", normalizedValue: "Cooking", categoryId: "15" },
  { alias: "cook", normalizedValue: "Cooking", categoryId: "15" },
  { alias: "commercial cooking", normalizedValue: "Cooking", categoryId: "15" },
  { alias: "cookery", normalizedValue: "Cooking", categoryId: "15" },
  { alias: "chef", normalizedValue: "Cooking", categoryId: "15" },
  { alias: "kusinero", normalizedValue: "Cooking", categoryId: "15" },
  { alias: "kusinera", normalizedValue: "Cooking", categoryId: "15" },
  { alias: "kitchen helper", normalizedValue: "Kitchen Operations", categoryId: "15" },
  { alias: "kitchen assistant", normalizedValue: "Kitchen Operations", categoryId: "15" },
  { alias: "short order cook", normalizedValue: "Cooking", categoryId: "15" },
  { alias: "baking", normalizedValue: "Baking", categoryId: "15" },
  { alias: "baker", normalizedValue: "Baking", categoryId: "15" },
  { alias: "panadero", normalizedValue: "Baking", categoryId: "15" },
  { alias: "bread and pastry", normalizedValue: "Baking", categoryId: "15" },
  { alias: "bread and pastry production", normalizedValue: "Baking", categoryId: "15" },
  { alias: "pastry making", normalizedValue: "Baking", categoryId: "15" },
  { alias: "cake decorating", normalizedValue: "Baking", categoryId: "15" },
  { alias: "pastry", normalizedValue: "Baking", categoryId: "15" },
  { alias: "bakery", normalizedValue: "Baking", categoryId: "15" },
  { alias: "worked in a bakery", normalizedValue: "Baking", categoryId: "15" },
  { alias: "bakery helper", normalizedValue: "Baking", categoryId: "15" },
  { alias: "food preparation", normalizedValue: "Food Processing", categoryId: "15" },
  { alias: "food processing", normalizedValue: "Food Processing", categoryId: "15" },
  { alias: "food preservation", normalizedValue: "Food Processing", categoryId: "15" },
  { alias: "meat processing", normalizedValue: "Food Processing", categoryId: "15" },
  { alias: "fish processing", normalizedValue: "Food Processing", categoryId: "15" },
  { alias: "food and beverage", normalizedValue: "Food and Beverages", categoryId: "15" },
  { alias: "food service", normalizedValue: "Food and Beverages", categoryId: "15" },
  { alias: "culinary", normalizedValue: "Cooking", categoryId: "15" },
  { alias: "culinary arts", normalizedValue: "Cooking", categoryId: "15" },
  { alias: "canteen helper", normalizedValue: "Kitchen Operations", categoryId: "15" },
  { alias: "carinderia assistant", normalizedValue: "Kitchen Operations", categoryId: "15" },

  // =========================================================================
  // 3: Automotive and Land Transport
  // =========================================================================
  { alias: "automotive", normalizedValue: "Automotive Servicing", categoryId: "3" },
  { alias: "automotive servicing", normalizedValue: "Automotive Servicing", categoryId: "3" },
  { alias: "auto repair", normalizedValue: "Automotive Servicing", categoryId: "3" },
  { alias: "car repair", normalizedValue: "Automotive Servicing", categoryId: "3" },
  { alias: "mechanic", normalizedValue: "Automotive Servicing", categoryId: "3" },
  { alias: "auto mechanic", normalizedValue: "Automotive Servicing", categoryId: "3" },
  { alias: "motorcycle repair", normalizedValue: "Motorcycle Servicing", categoryId: "3" },
  { alias: "motorcycle mechanic", normalizedValue: "Motorcycle Servicing", categoryId: "3" },
  { alias: "small engine repair", normalizedValue: "Motorcycle Servicing", categoryId: "3" },
  { alias: "vehicle repair", normalizedValue: "Automotive Servicing", categoryId: "3" },
  { alias: "talyer", normalizedValue: "Automotive Servicing", categoryId: "3" },
  { alias: "talyer assistant", normalizedValue: "Automotive Servicing", categoryId: "3" },
  { alias: "talyer helper", normalizedValue: "Automotive Servicing", categoryId: "3" },
  { alias: "driving", normalizedValue: "Driving", categoryId: "3" },
  { alias: "driver", normalizedValue: "Driving", categoryId: "3" },
  { alias: "professional driver", normalizedValue: "Driving", categoryId: "3" },
  { alias: "diesel mechanic", normalizedValue: "Automotive Servicing", categoryId: "3" },
  { alias: "vulcanizing", normalizedValue: "Automotive Servicing", categoryId: "3" },

  // =========================================================================
  // 4: Construction
  // =========================================================================
  { alias: "construction", normalizedValue: "Construction", categoryId: "4" },
  { alias: "construction worker", normalizedValue: "Construction", categoryId: "4" },
  { alias: "carpentry", normalizedValue: "Carpentry", categoryId: "4" },
  { alias: "carpenter", normalizedValue: "Carpentry", categoryId: "4" },
  { alias: "karpintero", normalizedValue: "Carpentry", categoryId: "4" },
  { alias: "woodworking", normalizedValue: "Carpentry", categoryId: "4" },
  { alias: "masonry", normalizedValue: "Masonry", categoryId: "4" },
  { alias: "mason", normalizedValue: "Masonry", categoryId: "4" },
  { alias: "plumbing", normalizedValue: "Plumbing", categoryId: "4" },
  { alias: "plumber", normalizedValue: "Plumbing", categoryId: "4" },
  { alias: "tubero", normalizedValue: "Plumbing", categoryId: "4" },
  { alias: "tile setting", normalizedValue: "Tile Setting", categoryId: "4" },
  { alias: "tile setter", normalizedValue: "Tile Setting", categoryId: "4" },
  { alias: "painting", normalizedValue: "Building Painting", categoryId: "4" },
  { alias: "painter", normalizedValue: "Building Painting", categoryId: "4" },
  { alias: "scaffolding", normalizedValue: "Scaffolding", categoryId: "4" },
  { alias: "pipefitting", normalizedValue: "Pipefitting", categoryId: "4" },
  { alias: "pipefitter", normalizedValue: "Pipefitting", categoryId: "4" },
  { alias: "welding", normalizedValue: "Welding", categoryId: "4" },
  { alias: "welder", normalizedValue: "Welding", categoryId: "4" },
  { alias: "smaw", normalizedValue: "Welding", categoryId: "4" },
  { alias: "smaw nc ii", normalizedValue: "Welding", categoryId: "4" },
  { alias: "shielded metal arc welding", normalizedValue: "Welding", categoryId: "4" },
  { alias: "tig welding", normalizedValue: "Welding", categoryId: "4" },
  { alias: "mig welding", normalizedValue: "Welding", categoryId: "4" },
  { alias: "gtaw", normalizedValue: "Welding", categoryId: "4" },
  { alias: "gmaw", normalizedValue: "Welding", categoryId: "4" },
  { alias: "metal fabrication", normalizedValue: "Metal Fabrication", categoryId: "4" },

  // =========================================================================
  // 5: Electrical and Electronics
  // =========================================================================
  { alias: "electrical", normalizedValue: "Electrical Installation", categoryId: "5" },
  { alias: "electrician", normalizedValue: "Electrical Installation", categoryId: "5" },
  { alias: "electrical installation", normalizedValue: "Electrical Installation", categoryId: "5" },
  { alias: "electrical installation and maintenance", normalizedValue: "Electrical Installation", categoryId: "5" },
  { alias: "eim nc ii", normalizedValue: "Electrical Installation", categoryId: "5" },
  { alias: "wiring", normalizedValue: "Electrical Installation", categoryId: "5" },
  { alias: "electrical wiring", normalizedValue: "Electrical Installation", categoryId: "5" },
  { alias: "house wiring", normalizedValue: "Electrical Installation", categoryId: "5" },
  { alias: "building wiring", normalizedValue: "Electrical Installation", categoryId: "5" },
  { alias: "electronics", normalizedValue: "Electronic Products Assembly", categoryId: "5" },
  { alias: "electronic repair", normalizedValue: "Electronic Products Assembly", categoryId: "5" },
  { alias: "electronic products assembly", normalizedValue: "Electronic Products Assembly", categoryId: "5" },
  { alias: "epas nc ii", normalizedValue: "Electronic Products Assembly", categoryId: "5" },
  { alias: "appliance repair", normalizedValue: "Electronic Products Assembly", categoryId: "5" },
  { alias: "cellphone repair", normalizedValue: "Electronic Products Assembly", categoryId: "5" },
  { alias: "solar installation", normalizedValue: "Electrical Installation", categoryId: "5" },

  // =========================================================================
  // 2: Agriculture
  // =========================================================================
  { alias: "agriculture", normalizedValue: "Agriculture", categoryId: "2" },
  { alias: "farming", normalizedValue: "Agriculture", categoryId: "2" },
  { alias: "farmer", normalizedValue: "Agriculture", categoryId: "2" },
  { alias: "crop production", normalizedValue: "Crop Production", categoryId: "2" },
  { alias: "organic farming", normalizedValue: "Organic Agriculture", categoryId: "2" },
  { alias: "organic agriculture", normalizedValue: "Organic Agriculture", categoryId: "2" },
  { alias: "animal production", normalizedValue: "Animal Production", categoryId: "2" },
  { alias: "poultry", normalizedValue: "Animal Production", categoryId: "2" },
  { alias: "swine raising", normalizedValue: "Animal Production", categoryId: "2" },
  { alias: "livestock", normalizedValue: "Animal Production", categoryId: "2" },
  { alias: "fisheries", normalizedValue: "Aquaculture", categoryId: "2" },
  { alias: "aquaculture", normalizedValue: "Aquaculture", categoryId: "2" },
  { alias: "fish farming", normalizedValue: "Aquaculture", categoryId: "2" },
  { alias: "gardening", normalizedValue: "Crop Production", categoryId: "2" },
  { alias: "horticulture", normalizedValue: "Crop Production", categoryId: "2" },
  { alias: "hydroponics", normalizedValue: "Crop Production", categoryId: "2" },

  // =========================================================================
  // 6: Entrepreneurship
  // =========================================================================
  { alias: "entrepreneurship", normalizedValue: "Entrepreneurship", categoryId: "6" },
  { alias: "entrepreneur", normalizedValue: "Entrepreneurship", categoryId: "6" },
  { alias: "business", normalizedValue: "Small Business Management", categoryId: "6" },
  { alias: "small business", normalizedValue: "Small Business Management", categoryId: "6" },
  { alias: "negosyo", normalizedValue: "Small Business Management", categoryId: "6" },
  { alias: "online selling", normalizedValue: "E-Commerce", categoryId: "6" },
  { alias: "bookkeeping", normalizedValue: "Bookkeeping", categoryId: "6" },
  { alias: "bookkeeper", normalizedValue: "Bookkeeping", categoryId: "6" },
  { alias: "accounting", normalizedValue: "Bookkeeping", categoryId: "6" },
  { alias: "store management", normalizedValue: "Small Business Management", categoryId: "6" },

  // =========================================================================
  // 9: Heating, Ventilating, Airconditioning and Refrigeration Technology
  // =========================================================================
  { alias: "hvac", normalizedValue: "HVAC Servicing", categoryId: "9" },
  { alias: "aircon", normalizedValue: "RAC Servicing", categoryId: "9" },
  { alias: "air conditioning", normalizedValue: "RAC Servicing", categoryId: "9" },
  { alias: "aircon repair", normalizedValue: "RAC Servicing", categoryId: "9" },
  { alias: "aircon cleaning", normalizedValue: "RAC Servicing", categoryId: "9" },
  { alias: "refrigeration", normalizedValue: "RAC Servicing", categoryId: "9" },
  { alias: "ref repair", normalizedValue: "RAC Servicing", categoryId: "9" },
  { alias: "rac servicing", normalizedValue: "RAC Servicing", categoryId: "9" },
  { alias: "hvac technician", normalizedValue: "HVAC Servicing", categoryId: "9" },

  // =========================================================================
  // 10: Human Health/ Health Care
  // =========================================================================
  { alias: "healthcare", normalizedValue: "Healthcare Services", categoryId: "10" },
  { alias: "health care", normalizedValue: "Healthcare Services", categoryId: "10" },
  { alias: "caregiving", normalizedValue: "Caregiving", categoryId: "10" },
  { alias: "caregiver", normalizedValue: "Caregiving", categoryId: "10" },
  { alias: "nursing assistant", normalizedValue: "Nursing Aide", categoryId: "10" },
  { alias: "nursing aide", normalizedValue: "Nursing Aide", categoryId: "10" },
  { alias: "elderly care", normalizedValue: "Caregiving", categoryId: "10" },
  { alias: "barangay health worker", normalizedValue: "Community Health Services", categoryId: "10" },
  { alias: "bhw", normalizedValue: "Community Health Services", categoryId: "10" },
  { alias: "first aid", normalizedValue: "Emergency Care", categoryId: "10" },
  { alias: "emergency medical responder", normalizedValue: "Emergency Care", categoryId: "10" },
  { alias: "pharmacy services", normalizedValue: "Pharmacy Services", categoryId: "10" },

  // =========================================================================
  // 12: Language
  // =========================================================================
  { alias: "language", normalizedValue: "Language Proficiency", categoryId: "12" },
  { alias: "english", normalizedValue: "English Communication", categoryId: "12" },
  { alias: "english communication", normalizedValue: "English Communication", categoryId: "12" },
  { alias: "workplace english", normalizedValue: "English Communication", categoryId: "12" },
  { alias: "nihongo", normalizedValue: "Japanese Language", categoryId: "12" },
  { alias: "japanese language", normalizedValue: "Japanese Language", categoryId: "12" },
  { alias: "mandarin", normalizedValue: "Chinese Language", categoryId: "12" },
  { alias: "korean language", normalizedValue: "Korean Language", categoryId: "12" },
  { alias: "call center communication", normalizedValue: "English Communication", categoryId: "12" },

  // =========================================================================
  // 14: Maritime
  // =========================================================================
  { alias: "maritime", normalizedValue: "Maritime", categoryId: "14" },
  { alias: "seaman", normalizedValue: "Maritime", categoryId: "14" },
  { alias: "seafaring", normalizedValue: "Maritime", categoryId: "14" },
  { alias: "deck cadet", normalizedValue: "Maritime", categoryId: "14" },
  { alias: "ship catering", normalizedValue: "Ships Catering", categoryId: "14" },
  { alias: "marine engineering", normalizedValue: "Marine Engineering", categoryId: "14" },

  // =========================================================================
  // 17: Tourism
  // =========================================================================
  { alias: "tourism", normalizedValue: "Tourism Services", categoryId: "17" },
  { alias: "tour guide", normalizedValue: "Tour Guiding", categoryId: "17" },
  { alias: "tour guiding", normalizedValue: "Tour Guiding", categoryId: "17" },
  { alias: "travel", normalizedValue: "Tourism Services", categoryId: "17" },
  { alias: "travel services", normalizedValue: "Tourism Services", categoryId: "17" },
  { alias: "hotel", normalizedValue: "Hotel Operations", categoryId: "17" },
  { alias: "hospitality", normalizedValue: "Hotel Operations", categoryId: "17" },
  { alias: "housekeeping", normalizedValue: "Housekeeping", categoryId: "17" },
  { alias: "front office", normalizedValue: "Front Office Services", categoryId: "17" },
  { alias: "front desk", normalizedValue: "Front Office Services", categoryId: "17" },
  { alias: "bartending", normalizedValue: "Bartending", categoryId: "17" },
  { alias: "bartender", normalizedValue: "Bartending", categoryId: "17" },
  { alias: "barista", normalizedValue: "Barista", categoryId: "17" },
  { alias: "waiter", normalizedValue: "Food and Beverage Service", categoryId: "17" },
  { alias: "waitress", normalizedValue: "Food and Beverage Service", categoryId: "17" },
  { alias: "food and beverage service", normalizedValue: "Food and Beverage Service", categoryId: "17" },

  // =========================================================================
  // 1: 21st Century Skills
  // =========================================================================
  { alias: "21st century skills", normalizedValue: "21st Century Skills", categoryId: "1" },
  { alias: "digital literacy", normalizedValue: "Digital Literacy", categoryId: "1" },
  { alias: "critical thinking", normalizedValue: "Critical Thinking", categoryId: "1" },
  { alias: "workplace communication", normalizedValue: "Workplace Communication", categoryId: "1" },
  { alias: "teamwork", normalizedValue: "Teamwork and Collaboration", categoryId: "1" },
  { alias: "environmental literacy", normalizedValue: "Environmental Literacy", categoryId: "1" },

  // =========================================================================
  // 13: Lifelong Learning Skills
  // =========================================================================
  { alias: "lifelong learning", normalizedValue: "Lifelong Learning", categoryId: "13" },
  { alias: "career planning", normalizedValue: "Career Planning", categoryId: "13" },
  { alias: "job interview skills", normalizedValue: "Job Interview Skills", categoryId: "13" },

  // =========================================================================
  // 16: Social, Community Development and Others
  // =========================================================================
  { alias: "community development", normalizedValue: "Community Development", categoryId: "16" },
  { alias: "barangay service", normalizedValue: "Barangay Service", categoryId: "16" },
  { alias: "barangay tanod", normalizedValue: "Barangay Security", categoryId: "16" },
  { alias: "disaster risk reduction", normalizedValue: "Disaster Preparedness", categoryId: "16" },
  { alias: "emergency response", normalizedValue: "Disaster Preparedness", categoryId: "16" },

  // =========================================================================
  // 18: TVET
  // =========================================================================
  { alias: "tvet", normalizedValue: "TVET Methodology", categoryId: "18" },
  { alias: "trainers methodology", normalizedValue: "Trainers Methodology", categoryId: "18" },
  { alias: "tm1", normalizedValue: "Trainers Methodology", categoryId: "18" },
  { alias: "tm i", normalizedValue: "Trainers Methodology", categoryId: "18" },

  // =========================================================================
  // 7: Gender and Development (GAD)
  // =========================================================================
  { alias: "gad", normalizedValue: "Gender and Development", categoryId: "7" },
  { alias: "gender sensitivity", normalizedValue: "Gender Sensitivity", categoryId: "7" },
  { alias: "gender and development", normalizedValue: "Gender and Development", categoryId: "7" },

  // =========================================================================
  // 8: Halal Awareness Program
  // =========================================================================
  { alias: "halal", normalizedValue: "Halal Awareness", categoryId: "8" },
  { alias: "halal awareness", normalizedValue: "Halal Awareness", categoryId: "8" },
  { alias: "halal standards", normalizedValue: "Halal Standards", categoryId: "8" },

  // =========================================================================
  // 20: International Labour Organization (ILO) Online Courses
  // =========================================================================
  { alias: "ilo", normalizedValue: "ILO Standards", categoryId: "20" },
  { alias: "occupational safety and health", normalizedValue: "Occupational Safety and Health", categoryId: "20" },
  { alias: "osh", normalizedValue: "Occupational Safety and Health", categoryId: "20" },
  { alias: "workers rights", normalizedValue: "Labor Standards", categoryId: "20" }
];
