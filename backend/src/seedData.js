import { db, initSchema, transaction } from "./db.js";

/**
 * Seed catalog for nine degree programs. Each course carries:
 *  - category: drives the requirement progress bars (Major / Math & Science / Gen Ed / Elective)
 *  - year / term: the course's recommended position in a standard 4-year plan,
 *    used by the "what year are you" selector and the Course Map flowchart.
 */
export const PROGRAMS = [
  {
    code: "CS-BS",
    name: "Computer Science, B.S.",
    degree_type: "B.S.",
    description: "Core computer science curriculum: programming, theory, systems, and a technical elective.",
    courses: {
      CS1411: { name: "Programming I", credits: 4, category: "Major", description: "Intro to programming.", prereq: [], days: "MWF", time: "09:00 - 09:50", mode: "In-Person", year: 1, term: "Fall" },
      UNIV1000: { name: "First-Year Seminar", credits: 1, category: "Gen Ed", description: "College success skills.", prereq: [], days: "MWF", time: "08:00 - 08:50", mode: "In-Person", year: 1, term: "Fall" },
      ENGL1301: { name: "Rhetoric I", credits: 3, category: "Gen Ed", description: "Composition.", prereq: [], days: "Online", time: "Asynchronous", mode: "Online", year: 1, term: "Fall" },
      MATH1451: { name: "Calculus I", credits: 4, category: "Math & Science", description: "Derivatives.", prereq: [], days: "MWF", time: "08:00 - 08:50", mode: "In-Person", year: 1, term: "Fall" },
      CS1412: { name: "Programming II", credits: 4, category: "Major", description: "OOP and data structures.", prereq: ["CS1411"], days: "MWF", time: "10:00 - 10:50", mode: "In-Person", year: 1, term: "Spring" },
      ENGL1302: { name: "Rhetoric II", credits: 3, category: "Gen Ed", description: "Advanced writing.", prereq: ["ENGL1301"], days: "TR", time: "12:30 - 13:45", mode: "Hybrid", year: 1, term: "Spring" },
      MATH1452: { name: "Calculus II", credits: 4, category: "Math & Science", description: "Integrals.", prereq: ["MATH1451"], days: "MWF", time: "09:00 - 09:50", mode: "In-Person", year: 1, term: "Spring" },
      CS1382: { name: "Discrete Structures", credits: 3, category: "Major", description: "Logic and graphs.", prereq: ["CS1411"], days: "TR", time: "11:00 - 12:15", mode: "In-Person", year: 2, term: "Fall" },
      CS2413: { name: "Data Structures", credits: 3, category: "Major", description: "Trees, lists, graphs.", prereq: ["CS1412"], days: "TR", time: "09:30 - 10:45", mode: "In-Person", year: 2, term: "Fall" },
      PHYS1408: { name: "Physics I", credits: 4, category: "Math & Science", description: "Mechanics.", prereq: ["MATH1451"], days: "MWF", time: "14:00 - 14:50", mode: "In-Person", year: 2, term: "Fall" },
      CS2365: { name: "OOP", credits: 3, category: "Major", description: "Advanced OOP.", prereq: ["CS2413"], days: "MWF", time: "11:00 - 11:50", mode: "In-Person", year: 2, term: "Spring" },
      PHYS2401: { name: "Physics II", credits: 4, category: "Math & Science", description: "Electricity.", prereq: ["PHYS1408", "MATH1452"], days: "MWF", time: "15:00 - 15:50", mode: "In-Person", year: 2, term: "Spring" },
      ARTS2301: { name: "Intro to Visual Arts", credits: 3, category: "Elective", description: "Art history and appreciation.", prereq: [], days: "TR", time: "10:00 - 11:15", mode: "In-Person", year: 2, term: "Spring" },
      CS3364: { name: "Algorithms", credits: 3, category: "Major", description: "Algorithm analysis.", prereq: ["CS2413", "CS1382"], days: "TR", time: "13:00 - 14:15", mode: "In-Person", year: 3, term: "Fall" },
      CS3375: { name: "Software Engineering", credits: 3, category: "Major", description: "Team software dev.", prereq: ["CS2365"], days: "MWF", time: "12:00 - 12:50", mode: "Hybrid", year: 3, term: "Spring" },
      CS3383: { name: "Automata Theory", credits: 3, category: "Major", description: "Formal languages.", prereq: ["CS3364"], days: "TR", time: "14:30 - 15:45", mode: "In-Person", year: 3, term: "Spring" },
      CS4352: { name: "Operating Systems", credits: 3, category: "Major", description: "OS internals.", prereq: ["CS3364"], days: "MWF", time: "13:00 - 13:50", mode: "In-Person", year: 4, term: "Fall" },
      CS4354: { name: "Database Systems", credits: 3, category: "Major", description: "SQL and DB design.", prereq: ["CS2413"], days: "Online", time: "Asynchronous", mode: "Online", year: 4, term: "Fall" },
      CS4390: { name: "Selected Topics: AI", credits: 3, category: "Elective", description: "Intro to machine learning and AI.", prereq: ["CS3364"], days: "TR", time: "16:00 - 17:15", mode: "In-Person", year: 4, term: "Spring" },
    },
  },
  {
    code: "BA-BBA",
    name: "Business Administration, B.B.A.",
    degree_type: "B.B.A.",
    description: "Foundational business curriculum spanning accounting, economics, finance, and management.",
    courses: {
      BUS1301: { name: "Intro to Business", credits: 3, category: "Major", description: "Foundations of business.", prereq: [], days: "MWF", time: "09:00 - 09:50", mode: "In-Person", year: 1, term: "Fall" },
      ECON2301: { name: "Microeconomics", credits: 3, category: "Major", description: "Markets and firm behavior.", prereq: [], days: "MWF", time: "10:00 - 10:50", mode: "In-Person", year: 1, term: "Fall" },
      ENGL1301: { name: "Rhetoric I", credits: 3, category: "Gen Ed", description: "Composition.", prereq: [], days: "Online", time: "Asynchronous", mode: "Online", year: 1, term: "Fall" },
      UNIV1000: { name: "First-Year Seminar", credits: 1, category: "Gen Ed", description: "College success skills.", prereq: [], days: "MWF", time: "08:00 - 08:50", mode: "In-Person", year: 1, term: "Fall" },
      MATH1324: { name: "Business Calculus", credits: 3, category: "Math & Science", description: "Applied calculus for business.", prereq: [], days: "MWF", time: "09:00 - 09:50", mode: "In-Person", year: 1, term: "Spring" },
      STAT2380: { name: "Business Statistics", credits: 3, category: "Math & Science", description: "Statistical methods for business.", prereq: [], days: "MWF", time: "08:00 - 08:50", mode: "In-Person", year: 1, term: "Spring" },
      ENGL1302: { name: "Rhetoric II", credits: 3, category: "Gen Ed", description: "Advanced writing.", prereq: ["ENGL1301"], days: "TR", time: "12:30 - 13:45", mode: "Hybrid", year: 1, term: "Spring" },
      ACCT2301: { name: "Financial Accounting", credits: 3, category: "Major", description: "Financial statements and reporting.", prereq: [], days: "TR", time: "09:30 - 10:45", mode: "In-Person", year: 2, term: "Fall" },
      ECON2302: { name: "Macroeconomics", credits: 3, category: "Major", description: "National economies and policy.", prereq: ["ECON2301"], days: "MWF", time: "11:00 - 11:50", mode: "In-Person", year: 2, term: "Fall" },
      ACCT2302: { name: "Managerial Accounting", credits: 3, category: "Major", description: "Cost and decision accounting.", prereq: ["ACCT2301"], days: "TR", time: "11:00 - 12:15", mode: "In-Person", year: 2, term: "Spring" },
      COMM2301: { name: "Public Speaking", credits: 3, category: "Elective", description: "Applied business communication.", prereq: [], days: "TR", time: "10:00 - 11:15", mode: "In-Person", year: 2, term: "Spring" },
      MKT3321: { name: "Principles of Marketing", credits: 3, category: "Major", description: "Markets, branding, and strategy.", prereq: ["BUS1301"], days: "MWF", time: "12:00 - 12:50", mode: "Hybrid", year: 3, term: "Fall" },
      MGT3322: { name: "Organizational Behavior", credits: 3, category: "Major", description: "People and management theory.", prereq: ["BUS1301"], days: "TR", time: "14:30 - 15:45", mode: "In-Person", year: 3, term: "Fall" },
      FIN3320: { name: "Corporate Finance", credits: 3, category: "Major", description: "Valuation and capital budgeting.", prereq: ["ACCT2301", "ECON2301"], days: "TR", time: "13:00 - 14:15", mode: "In-Person", year: 3, term: "Spring" },
      BLAW3391: { name: "Business Law", credits: 3, category: "Elective", description: "Legal environment of business.", prereq: [], days: "Online", time: "Asynchronous", mode: "Online", year: 3, term: "Spring" },
      MGT4395: { name: "Leadership Seminar", credits: 3, category: "Elective", description: "Applied leadership practice.", prereq: ["MGT3322"], days: "TR", time: "10:00 - 11:15", mode: "In-Person", year: 4, term: "Fall" },
      BUS4390: { name: "Strategic Management", credits: 3, category: "Major", description: "Capstone strategy course.", prereq: ["MKT3321", "MGT3322", "FIN3320"], days: "MWF", time: "13:00 - 13:50", mode: "In-Person", year: 4, term: "Spring" },
    },
  },
  {
    code: "PSYC-BA",
    name: "Psychology, B.A.",
    degree_type: "B.A.",
    description: "Foundations of psychological science, from research methods through biopsychology and clinical topics.",
    courses: {
      PSYC1300: { name: "Intro to Psychology", credits: 3, category: "Major", description: "Survey of the field.", prereq: [], days: "MWF", time: "09:00 - 09:50", mode: "In-Person", year: 1, term: "Fall" },
      UNIV1000: { name: "First-Year Seminar", credits: 1, category: "Gen Ed", description: "College success skills.", prereq: [], days: "MWF", time: "08:00 - 08:50", mode: "In-Person", year: 1, term: "Fall" },
      ENGL1301: { name: "Rhetoric I", credits: 3, category: "Gen Ed", description: "Composition.", prereq: [], days: "Online", time: "Asynchronous", mode: "Online", year: 1, term: "Fall" },
      MATH1342: { name: "Elementary Statistics", credits: 3, category: "Math & Science", description: "Statistical reasoning.", prereq: [], days: "TR", time: "09:30 - 10:45", mode: "In-Person", year: 1, term: "Fall" },
      PSYC2301: { name: "Developmental Psychology", credits: 3, category: "Major", description: "Lifespan development.", prereq: ["PSYC1300"], days: "MWF", time: "10:00 - 10:50", mode: "In-Person", year: 1, term: "Spring" },
      BIOL1408: { name: "General Biology I", credits: 4, category: "Math & Science", description: "Biology foundations.", prereq: [], days: "MWF", time: "13:00 - 13:50", mode: "In-Person", year: 1, term: "Spring" },
      ENGL1302: { name: "Rhetoric II", credits: 3, category: "Gen Ed", description: "Advanced writing.", prereq: ["ENGL1301"], days: "TR", time: "12:30 - 13:45", mode: "Hybrid", year: 1, term: "Spring" },
      PSYC2314: { name: "Research Methods", credits: 3, category: "Major", description: "Experimental design in psychology.", prereq: ["PSYC1300", "MATH1342"], days: "TR", time: "11:00 - 12:15", mode: "In-Person", year: 2, term: "Fall" },
      PSYC3301: { name: "Abnormal Psychology", credits: 3, category: "Major", description: "Psychopathology.", prereq: ["PSYC2301"], days: "MWF", time: "12:00 - 12:50", mode: "In-Person", year: 2, term: "Fall" },
      SOCI1301: { name: "Intro to Sociology", credits: 3, category: "Gen Ed", description: "Social structures and behavior.", prereq: [], days: "TR", time: "09:30 - 10:45", mode: "In-Person", year: 2, term: "Fall" },
      PSYC3303: { name: "Cognitive Psychology", credits: 3, category: "Major", description: "Memory, attention, and reasoning.", prereq: ["PSYC2314"], days: "TR", time: "13:00 - 14:15", mode: "In-Person", year: 2, term: "Spring" },
      PSYC3310: { name: "Social Psychology", credits: 3, category: "Major", description: "The individual in social context.", prereq: ["PSYC2301"], days: "MWF", time: "09:00 - 09:50", mode: "In-Person", year: 2, term: "Spring" },
      PHIL2301: { name: "Intro to Philosophy", credits: 3, category: "Gen Ed", description: "Great philosophical questions.", prereq: [], days: "Online", time: "Asynchronous", mode: "Online", year: 2, term: "Spring" },
      PSYC3320: { name: "Personality Theory", credits: 3, category: "Major", description: "Theories of personality.", prereq: ["PSYC3301"], days: "MWF", time: "11:00 - 11:50", mode: "In-Person", year: 3, term: "Fall" },
      PSYC4301: { name: "Biopsychology", credits: 3, category: "Major", description: "Brain and behavior.", prereq: ["PSYC3303", "BIOL1408"], days: "TR", time: "14:30 - 15:45", mode: "In-Person", year: 3, term: "Fall" },
      COMM2301: { name: "Public Speaking", credits: 3, category: "Elective", description: "Applied communication.", prereq: [], days: "TR", time: "10:00 - 11:15", mode: "In-Person", year: 3, term: "Spring" },
      PSYC4310: { name: "Psychological Testing", credits: 3, category: "Major", description: "Assessment and measurement.", prereq: ["PSYC2314"], days: "MWF", time: "13:00 - 13:50", mode: "In-Person", year: 3, term: "Spring" },
      PSYC4390: { name: "Selected Topics in Psychology", credits: 3, category: "Elective", description: "Rotating advanced topics.", prereq: ["PSYC3320"], days: "TR", time: "16:00 - 17:15", mode: "In-Person", year: 4, term: "Fall" },
      PSYC4398: { name: "Senior Capstone", credits: 3, category: "Major", description: "Capstone research thesis.", prereq: ["PSYC4301", "PSYC4310"], days: "MWF", time: "12:00 - 12:50", mode: "In-Person", year: 4, term: "Spring" },
    },
  },
  {
    code: "BIOL-BS",
    name: "Biology, B.S.",
    degree_type: "B.S.",
    description: "Core biology sequence through genetics, cell biology, and a senior research capstone.",
    courses: {
      BIOL1406: { name: "General Biology I", credits: 4, category: "Major", description: "Cell structure and function.", prereq: [], days: "MWF", time: "09:00 - 09:50", mode: "In-Person", year: 1, term: "Fall" },
      CHEM1411: { name: "General Chemistry I", credits: 4, category: "Math & Science", description: "Atomic structure and bonding.", prereq: [], days: "TR", time: "09:30 - 10:45", mode: "In-Person", year: 1, term: "Fall" },
      MATH1451: { name: "Calculus I", credits: 4, category: "Math & Science", description: "Derivatives.", prereq: [], days: "MWF", time: "08:00 - 08:50", mode: "In-Person", year: 1, term: "Fall" },
      ENGL1301: { name: "Rhetoric I", credits: 3, category: "Gen Ed", description: "Composition.", prereq: [], days: "Online", time: "Asynchronous", mode: "Online", year: 1, term: "Fall" },
      UNIV1000: { name: "First-Year Seminar", credits: 1, category: "Gen Ed", description: "College success skills.", prereq: [], days: "TR", time: "08:00 - 08:50", mode: "In-Person", year: 1, term: "Fall" },
      BIOL1407: { name: "General Biology II", credits: 4, category: "Major", description: "Organismal biology.", prereq: ["BIOL1406"], days: "MWF", time: "09:00 - 09:50", mode: "In-Person", year: 1, term: "Spring" },
      CHEM1412: { name: "General Chemistry II", credits: 4, category: "Math & Science", description: "Reactions and equilibrium.", prereq: ["CHEM1411"], days: "TR", time: "09:30 - 10:45", mode: "In-Person", year: 1, term: "Spring" },
      ENGL1302: { name: "Rhetoric II", credits: 3, category: "Gen Ed", description: "Advanced writing.", prereq: ["ENGL1301"], days: "TR", time: "12:30 - 13:45", mode: "Hybrid", year: 1, term: "Spring" },
      BIOL2401: { name: "Genetics", credits: 4, category: "Major", description: "Classical and molecular genetics.", prereq: ["BIOL1407"], days: "MWF", time: "10:00 - 10:50", mode: "In-Person", year: 2, term: "Fall" },
      CHEM2423: { name: "Organic Chemistry I", credits: 4, category: "Math & Science", description: "Structure and reactivity.", prereq: ["CHEM1412"], days: "TR", time: "11:00 - 12:15", mode: "In-Person", year: 2, term: "Fall" },
      STAT2380: { name: "Biostatistics", credits: 3, category: "Math & Science", description: "Statistics for life sciences.", prereq: [], days: "MWF", time: "12:00 - 12:50", mode: "In-Person", year: 2, term: "Fall" },
      BIOL2402: { name: "Microbiology", credits: 4, category: "Major", description: "Microbial life.", prereq: ["BIOL1407"], days: "MWF", time: "10:00 - 10:50", mode: "In-Person", year: 2, term: "Spring" },
      CHEM2424: { name: "Organic Chemistry II", credits: 4, category: "Math & Science", description: "Synthesis and mechanisms.", prereq: ["CHEM2423"], days: "TR", time: "11:00 - 12:15", mode: "In-Person", year: 2, term: "Spring" },
      HIST1301: { name: "World History I", credits: 3, category: "Gen Ed", description: "Survey to 1500.", prereq: [], days: "Online", time: "Asynchronous", mode: "Online", year: 2, term: "Spring" },
      BIOL3401: { name: "Cell Biology", credits: 4, category: "Major", description: "Cellular processes.", prereq: ["BIOL2401"], days: "MWF", time: "13:00 - 13:50", mode: "In-Person", year: 3, term: "Fall" },
      BIOL3402: { name: "Ecology", credits: 3, category: "Major", description: "Populations and ecosystems.", prereq: ["BIOL1407"], days: "TR", time: "13:00 - 14:15", mode: "In-Person", year: 3, term: "Fall" },
      BIOL3410: { name: "Physiology", credits: 4, category: "Major", description: "Organ system function.", prereq: ["BIOL2401"], days: "MWF", time: "13:00 - 13:50", mode: "In-Person", year: 3, term: "Spring" },
      BIOL4401: { name: "Molecular Biology", credits: 4, category: "Major", description: "Gene expression and regulation.", prereq: ["BIOL3401"], days: "TR", time: "14:30 - 15:45", mode: "In-Person", year: 4, term: "Fall" },
      BIOL4490: { name: "Selected Topics: Biotechnology", credits: 3, category: "Elective", description: "Applied biotech methods.", prereq: ["BIOL3401"], days: "MWF", time: "14:00 - 14:50", mode: "In-Person", year: 4, term: "Fall" },
      BIOL4498: { name: "Senior Research Capstone", credits: 3, category: "Major", description: "Independent research project.", prereq: ["BIOL4401"], days: "MWF", time: "12:00 - 12:50", mode: "In-Person", year: 4, term: "Spring" },
    },
  },
  {
    code: "ME-BS",
    name: "Mechanical Engineering, B.S.",
    degree_type: "B.S.",
    description: "Statics through thermodynamics, fluid mechanics, and a capstone design project.",
    courses: {
      MATH1451: { name: "Calculus I", credits: 4, category: "Math & Science", description: "Derivatives.", prereq: [], days: "MWF", time: "08:00 - 08:50", mode: "In-Person", year: 1, term: "Fall" },
      CHEM1411: { name: "General Chemistry I", credits: 4, category: "Math & Science", description: "Atomic structure and bonding.", prereq: [], days: "TR", time: "09:30 - 10:45", mode: "In-Person", year: 1, term: "Fall" },
      ENGL1301: { name: "Rhetoric I", credits: 3, category: "Gen Ed", description: "Composition.", prereq: [], days: "Online", time: "Asynchronous", mode: "Online", year: 1, term: "Fall" },
      ME1301: { name: "Intro to Mechanical Engineering", credits: 2, category: "Major", description: "Design thinking and CAD basics.", prereq: [], days: "MWF", time: "10:00 - 10:50", mode: "In-Person", year: 1, term: "Fall" },
      MATH1452: { name: "Calculus II", credits: 4, category: "Math & Science", description: "Integrals.", prereq: ["MATH1451"], days: "MWF", time: "08:00 - 08:50", mode: "In-Person", year: 1, term: "Spring" },
      PHYS1408: { name: "Physics I: Mechanics", credits: 4, category: "Math & Science", description: "Newtonian mechanics.", prereq: ["MATH1451"], days: "MWF", time: "09:00 - 09:50", mode: "In-Person", year: 1, term: "Spring" },
      ENGL1302: { name: "Rhetoric II", credits: 3, category: "Gen Ed", description: "Advanced writing.", prereq: ["ENGL1301"], days: "TR", time: "12:30 - 13:45", mode: "Hybrid", year: 1, term: "Spring" },
      ME2301: { name: "Engineering Statics", credits: 3, category: "Major", description: "Forces in equilibrium.", prereq: ["PHYS1408", "MATH1452"], days: "TR", time: "09:30 - 10:45", mode: "In-Person", year: 2, term: "Fall" },
      MATH2450: { name: "Differential Equations", credits: 3, category: "Math & Science", description: "ODEs and applications.", prereq: ["MATH1452"], days: "MWF", time: "11:00 - 11:50", mode: "In-Person", year: 2, term: "Fall" },
      PHYS2401: { name: "Physics II: Electricity & Magnetism", credits: 4, category: "Math & Science", description: "Circuits and fields.", prereq: ["PHYS1408", "MATH1452"], days: "MWF", time: "15:00 - 15:50", mode: "In-Person", year: 2, term: "Fall" },
      ME2302: { name: "Engineering Dynamics", credits: 3, category: "Major", description: "Kinematics and kinetics.", prereq: ["ME2301"], days: "TR", time: "09:30 - 10:45", mode: "In-Person", year: 2, term: "Spring" },
      ME2350: { name: "Thermodynamics I", credits: 3, category: "Major", description: "Energy and entropy.", prereq: ["PHYS1408", "MATH1452"], days: "MWF", time: "12:00 - 12:50", mode: "In-Person", year: 2, term: "Spring" },
      STAT2380: { name: "Engineering Statistics", credits: 3, category: "Math & Science", description: "Statistics for engineers.", prereq: [], days: "MWF", time: "08:00 - 08:50", mode: "In-Person", year: 2, term: "Spring" },
      ME3301: { name: "Mechanics of Materials", credits: 3, category: "Major", description: "Stress and strain.", prereq: ["ME2301"], days: "TR", time: "13:00 - 14:15", mode: "In-Person", year: 3, term: "Fall" },
      ME3350: { name: "Fluid Mechanics", credits: 3, category: "Major", description: "Fluid statics and dynamics.", prereq: ["ME2350"], days: "MWF", time: "13:00 - 13:50", mode: "In-Person", year: 3, term: "Fall" },
      ME3360: { name: "Manufacturing Processes", credits: 3, category: "Major", description: "Machining and materials processing.", prereq: ["ME2301"], days: "TR", time: "11:00 - 12:15", mode: "In-Person", year: 3, term: "Spring" },
      ME3370: { name: "Heat Transfer", credits: 3, category: "Major", description: "Conduction, convection, radiation.", prereq: ["ME2350"], days: "MWF", time: "14:00 - 14:50", mode: "In-Person", year: 3, term: "Spring" },
      ME4301: { name: "Machine Design", credits: 3, category: "Major", description: "Design of mechanical components.", prereq: ["ME3301"], days: "TR", time: "13:00 - 14:15", mode: "In-Person", year: 4, term: "Fall" },
      ME4390: { name: "Selected Topics: Robotics", credits: 3, category: "Elective", description: "Intro to robotic systems.", prereq: ["ME3301"], days: "MWF", time: "15:00 - 15:50", mode: "In-Person", year: 4, term: "Fall" },
      ME4498: { name: "Capstone Design Project", credits: 3, category: "Major", description: "Team engineering design project.", prereq: ["ME4301", "ME3350"], days: "MWF", time: "12:00 - 12:50", mode: "In-Person", year: 4, term: "Spring" },
    },
  },
  {
    code: "NURS-BSN",
    name: "Nursing, B.S.N.",
    degree_type: "B.S.N.",
    description: "Pre-licensure nursing curriculum from health assessment through a senior practicum.",
    courses: {
      BIOL2401: { name: "Anatomy & Physiology I", credits: 4, category: "Math & Science", description: "Structure and function I.", prereq: [], days: "MWF", time: "09:00 - 09:50", mode: "In-Person", year: 1, term: "Fall" },
      CHEM1405: { name: "Intro to Chemistry", credits: 4, category: "Math & Science", description: "Chemistry for health sciences.", prereq: [], days: "TR", time: "09:30 - 10:45", mode: "In-Person", year: 1, term: "Fall" },
      ENGL1301: { name: "Rhetoric I", credits: 3, category: "Gen Ed", description: "Composition.", prereq: [], days: "Online", time: "Asynchronous", mode: "Online", year: 1, term: "Fall" },
      NURS1301: { name: "Intro to the Nursing Profession", credits: 2, category: "Major", description: "Professional foundations.", prereq: [], days: "MWF", time: "11:00 - 11:50", mode: "In-Person", year: 1, term: "Fall" },
      BIOL2402: { name: "Anatomy & Physiology II", credits: 4, category: "Math & Science", description: "Structure and function II.", prereq: ["BIOL2401"], days: "MWF", time: "09:00 - 09:50", mode: "In-Person", year: 1, term: "Spring" },
      PSYC1300: { name: "Intro to Psychology", credits: 3, category: "Gen Ed", description: "Survey of the field.", prereq: [], days: "TR", time: "09:30 - 10:45", mode: "In-Person", year: 1, term: "Spring" },
      ENGL1302: { name: "Rhetoric II", credits: 3, category: "Gen Ed", description: "Advanced writing.", prereq: ["ENGL1301"], days: "TR", time: "12:30 - 13:45", mode: "Hybrid", year: 1, term: "Spring" },
      BIOL2420: { name: "Microbiology", credits: 4, category: "Math & Science", description: "Microbial life and infection.", prereq: ["BIOL2401"], days: "MWF", time: "10:00 - 10:50", mode: "In-Person", year: 2, term: "Fall" },
      STAT2380: { name: "Statistics for Health Sciences", credits: 3, category: "Math & Science", description: "Applied health statistics.", prereq: [], days: "MWF", time: "08:00 - 08:50", mode: "In-Person", year: 2, term: "Fall" },
      NURS2301: { name: "Health Assessment", credits: 3, category: "Major", description: "Physical assessment skills.", prereq: ["NURS1301", "BIOL2402"], days: "TR", time: "11:00 - 12:15", mode: "In-Person", year: 2, term: "Fall" },
      NURS2310: { name: "Pharmacology I", credits: 3, category: "Major", description: "Medication administration.", prereq: ["BIOL2402"], days: "MWF", time: "12:00 - 12:50", mode: "In-Person", year: 2, term: "Spring" },
      NURS2320: { name: "Fundamentals of Nursing Practice", credits: 4, category: "Major", description: "Core clinical skills.", prereq: ["NURS2301"], days: "TR", time: "13:00 - 15:00", mode: "In-Person", year: 2, term: "Spring" },
      PSYC2301: { name: "Developmental Psychology", credits: 3, category: "Gen Ed", description: "Lifespan development.", prereq: ["PSYC1300"], days: "MWF", time: "10:00 - 10:50", mode: "In-Person", year: 2, term: "Spring" },
      NURS3301: { name: "Adult Health Nursing I", credits: 5, category: "Major", description: "Care of the adult patient.", prereq: ["NURS2320", "NURS2310"], days: "TR", time: "09:00 - 11:30", mode: "In-Person", year: 3, term: "Fall" },
      NURS3310: { name: "Mental Health Nursing", credits: 3, category: "Major", description: "Psychiatric nursing care.", prereq: ["NURS2320"], days: "MWF", time: "13:00 - 13:50", mode: "In-Person", year: 3, term: "Fall" },
      NURS3320: { name: "Adult Health Nursing II", credits: 5, category: "Major", description: "Complex adult care.", prereq: ["NURS3301"], days: "TR", time: "09:00 - 11:30", mode: "In-Person", year: 3, term: "Spring" },
      NURS3330: { name: "Maternal & Child Nursing", credits: 4, category: "Major", description: "Obstetric and pediatric care.", prereq: ["NURS3301"], days: "MWF", time: "14:00 - 15:30", mode: "In-Person", year: 3, term: "Spring" },
      NURS4301: { name: "Community Health Nursing", credits: 3, category: "Major", description: "Population-level care.", prereq: ["NURS3320"], days: "TR", time: "13:00 - 14:15", mode: "In-Person", year: 4, term: "Fall" },
      NURS4310: { name: "Nursing Leadership & Management", credits: 3, category: "Major", description: "Care coordination and leadership.", prereq: ["NURS3320"], days: "MWF", time: "15:00 - 15:50", mode: "In-Person", year: 4, term: "Fall" },
      NURS4498: { name: "Capstone Practicum", credits: 4, category: "Major", description: "Precepted clinical practicum.", prereq: ["NURS4301", "NURS4310"], days: "TR", time: "09:00 - 11:30", mode: "In-Person", year: 4, term: "Spring" },
    },
  },
  {
    code: "ENGL-BA",
    name: "English, B.A.",
    degree_type: "B.A.",
    description: "Literary studies from foundational survey courses through a senior thesis.",
    courses: {
      ENGL1301: { name: "Rhetoric I", credits: 3, category: "Gen Ed", description: "Composition.", prereq: [], days: "Online", time: "Asynchronous", mode: "Online", year: 1, term: "Fall" },
      UNIV1000: { name: "First-Year Seminar", credits: 1, category: "Gen Ed", description: "College success skills.", prereq: [], days: "MWF", time: "08:00 - 08:50", mode: "In-Person", year: 1, term: "Fall" },
      HIST1301: { name: "World History I", credits: 3, category: "Gen Ed", description: "Survey to 1500.", prereq: [], days: "TR", time: "09:30 - 10:45", mode: "In-Person", year: 1, term: "Fall" },
      ENGL2301: { name: "Introduction to Literary Studies", credits: 3, category: "Major", description: "Methods of literary analysis.", prereq: [], days: "MWF", time: "10:00 - 10:50", mode: "In-Person", year: 1, term: "Fall" },
      ENGL1302: { name: "Rhetoric II", credits: 3, category: "Gen Ed", description: "Advanced writing.", prereq: ["ENGL1301"], days: "TR", time: "12:30 - 13:45", mode: "Hybrid", year: 1, term: "Spring" },
      ENGL2310: { name: "British Literature I", credits: 3, category: "Major", description: "Medieval to 18th century.", prereq: ["ENGL2301"], days: "MWF", time: "10:00 - 10:50", mode: "In-Person", year: 1, term: "Spring" },
      COMM2301: { name: "Public Speaking", credits: 3, category: "Elective", description: "Applied communication.", prereq: [], days: "TR", time: "10:00 - 11:15", mode: "In-Person", year: 1, term: "Spring" },
      MATH1342: { name: "Elementary Statistics", credits: 3, category: "Math & Science", description: "Statistical reasoning.", prereq: [], days: "MWF", time: "08:00 - 08:50", mode: "In-Person", year: 1, term: "Spring" },
      ENGL2320: { name: "American Literature I", credits: 3, category: "Major", description: "Colonial through 19th century.", prereq: ["ENGL2301"], days: "MWF", time: "11:00 - 11:50", mode: "In-Person", year: 2, term: "Fall" },
      ENGL3301: { name: "Shakespeare", credits: 3, category: "Major", description: "Major plays and sonnets.", prereq: ["ENGL2310"], days: "TR", time: "11:00 - 12:15", mode: "In-Person", year: 2, term: "Fall" },
      PHIL2301: { name: "Intro to Philosophy", credits: 3, category: "Gen Ed", description: "Great philosophical questions.", prereq: [], days: "Online", time: "Asynchronous", mode: "Online", year: 2, term: "Fall" },
      ENGL3310: { name: "Literary Theory & Criticism", credits: 3, category: "Major", description: "Critical frameworks.", prereq: ["ENGL2320"], days: "MWF", time: "12:00 - 12:50", mode: "In-Person", year: 2, term: "Spring" },
      ENGL3320: { name: "Creative Writing: Fiction", credits: 3, category: "Major", description: "Fiction workshop.", prereq: ["ENGL2301"], days: "TR", time: "13:00 - 14:15", mode: "In-Person", year: 2, term: "Spring" },
      LING2301: { name: "Intro to Linguistics", credits: 3, category: "Elective", description: "Language structure.", prereq: [], days: "MWF", time: "13:00 - 13:50", mode: "In-Person", year: 2, term: "Spring" },
      ENGL4301: { name: "Postcolonial Literature", credits: 3, category: "Major", description: "Global anglophone literature.", prereq: ["ENGL3310"], days: "TR", time: "14:30 - 15:45", mode: "In-Person", year: 3, term: "Fall" },
      ENGL4310: { name: "Rhetoric & Composition Theory", credits: 3, category: "Major", description: "Theories of writing.", prereq: ["ENGL3310"], days: "MWF", time: "14:00 - 14:50", mode: "In-Person", year: 3, term: "Fall" },
      ENGL4320: { name: "Creative Writing: Poetry", credits: 3, category: "Elective", description: "Poetry workshop.", prereq: ["ENGL3320"], days: "TR", time: "13:00 - 14:15", mode: "In-Person", year: 3, term: "Spring" },
      ENGL4330: { name: "Studies in Genre", credits: 3, category: "Major", description: "Deep dive into a literary genre.", prereq: ["ENGL3301"], days: "MWF", time: "15:00 - 15:50", mode: "In-Person", year: 3, term: "Spring" },
      ENGL4390: { name: "Selected Topics in Literature", credits: 3, category: "Elective", description: "Rotating advanced topics.", prereq: ["ENGL4301"], days: "TR", time: "16:00 - 17:15", mode: "In-Person", year: 4, term: "Fall" },
      ENGL4498: { name: "Senior Capstone Thesis", credits: 3, category: "Major", description: "Independent thesis project.", prereq: ["ENGL4310", "ENGL4330"], days: "MWF", time: "12:00 - 12:50", mode: "In-Person", year: 4, term: "Spring" },
    },
  },
  {
    code: "MATH-BS",
    name: "Mathematics, B.S.",
    degree_type: "B.S.",
    description: "Pure and applied mathematics from calculus through real analysis and abstract algebra.",
    courses: {
      MATH1451: { name: "Calculus I", credits: 4, category: "Major", description: "Derivatives.", prereq: [], days: "MWF", time: "08:00 - 08:50", mode: "In-Person", year: 1, term: "Fall" },
      ENGL1301: { name: "Rhetoric I", credits: 3, category: "Gen Ed", description: "Composition.", prereq: [], days: "Online", time: "Asynchronous", mode: "Online", year: 1, term: "Fall" },
      UNIV1000: { name: "First-Year Seminar", credits: 1, category: "Gen Ed", description: "College success skills.", prereq: [], days: "TR", time: "08:00 - 08:50", mode: "In-Person", year: 1, term: "Fall" },
      CHEM1411: { name: "General Chemistry I", credits: 4, category: "Math & Science", description: "Lab science requirement.", prereq: [], days: "TR", time: "09:30 - 10:45", mode: "In-Person", year: 1, term: "Fall" },
      MATH1452: { name: "Calculus II", credits: 4, category: "Major", description: "Integrals.", prereq: ["MATH1451"], days: "MWF", time: "08:00 - 08:50", mode: "In-Person", year: 1, term: "Spring" },
      ENGL1302: { name: "Rhetoric II", credits: 3, category: "Gen Ed", description: "Advanced writing.", prereq: ["ENGL1301"], days: "TR", time: "12:30 - 13:45", mode: "Hybrid", year: 1, term: "Spring" },
      PHYS1408: { name: "Physics I", credits: 4, category: "Math & Science", description: "Mechanics.", prereq: ["MATH1451"], days: "MWF", time: "09:00 - 09:50", mode: "In-Person", year: 1, term: "Spring" },
      MATH2450: { name: "Calculus III", credits: 4, category: "Major", description: "Multivariable calculus.", prereq: ["MATH1452"], days: "MWF", time: "10:00 - 10:50", mode: "In-Person", year: 2, term: "Fall" },
      MATH2451: { name: "Linear Algebra", credits: 3, category: "Major", description: "Vector spaces and matrices.", prereq: ["MATH1452"], days: "TR", time: "11:00 - 12:15", mode: "In-Person", year: 2, term: "Fall" },
      MATH2452: { name: "Differential Equations", credits: 3, category: "Major", description: "ODEs and applications.", prereq: ["MATH2450"], days: "MWF", time: "10:00 - 10:50", mode: "In-Person", year: 2, term: "Spring" },
      MATH3301: { name: "Discrete Mathematics", credits: 3, category: "Major", description: "Logic, sets, and combinatorics.", prereq: ["MATH1452"], days: "TR", time: "11:00 - 12:15", mode: "In-Person", year: 2, term: "Spring" },
      STAT3380: { name: "Probability & Statistics", credits: 3, category: "Major", description: "Mathematical statistics.", prereq: ["MATH2450"], days: "MWF", time: "12:00 - 12:50", mode: "In-Person", year: 3, term: "Fall" },
      MATH3310: { name: "Abstract Algebra I", credits: 3, category: "Major", description: "Groups and rings.", prereq: ["MATH2451", "MATH3301"], days: "TR", time: "13:00 - 14:15", mode: "In-Person", year: 3, term: "Fall" },
      MATH3320: { name: "Real Analysis I", credits: 3, category: "Major", description: "Rigorous calculus foundations.", prereq: ["MATH2450", "MATH2451"], days: "MWF", time: "13:00 - 13:50", mode: "In-Person", year: 3, term: "Spring" },
      MATH3330: { name: "Numerical Methods", credits: 3, category: "Major", description: "Computational approximation.", prereq: ["MATH2452"], days: "TR", time: "13:00 - 14:15", mode: "In-Person", year: 3, term: "Spring" },
      MATH4301: { name: "Abstract Algebra II", credits: 3, category: "Major", description: "Fields and Galois theory intro.", prereq: ["MATH3310"], days: "TR", time: "14:30 - 15:45", mode: "In-Person", year: 4, term: "Fall" },
      MATH4390: { name: "Selected Topics: Graph Theory", credits: 3, category: "Elective", description: "Graphs and networks.", prereq: ["MATH3301"], days: "MWF", time: "14:00 - 14:50", mode: "In-Person", year: 4, term: "Fall" },
      MATH4320: { name: "Real Analysis II", credits: 3, category: "Major", description: "Sequences of functions, integration.", prereq: ["MATH3320"], days: "MWF", time: "15:00 - 15:50", mode: "In-Person", year: 4, term: "Spring" },
      MATH4498: { name: "Senior Capstone Seminar", credits: 3, category: "Major", description: "Capstone presentation and paper.", prereq: ["MATH4301", "MATH3320"], days: "TR", time: "13:00 - 14:15", mode: "In-Person", year: 4, term: "Spring" },
    },
  },
  {
    code: "COMM-BA",
    name: "Communication Studies, B.A.",
    degree_type: "B.A.",
    description: "Communication theory and practice across interpersonal, organizational, and media contexts.",
    courses: {
      ENGL1301: { name: "Rhetoric I", credits: 3, category: "Gen Ed", description: "Composition.", prereq: [], days: "Online", time: "Asynchronous", mode: "Online", year: 1, term: "Fall" },
      UNIV1000: { name: "First-Year Seminar", credits: 1, category: "Gen Ed", description: "College success skills.", prereq: [], days: "MWF", time: "08:00 - 08:50", mode: "In-Person", year: 1, term: "Fall" },
      COMM1301: { name: "Intro to Communication Studies", credits: 3, category: "Major", description: "Survey of the field.", prereq: [], days: "MWF", time: "09:00 - 09:50", mode: "In-Person", year: 1, term: "Fall" },
      COMM1310: { name: "Public Speaking", credits: 3, category: "Major", description: "Oral presentation skills.", prereq: [], days: "TR", time: "09:30 - 10:45", mode: "In-Person", year: 1, term: "Fall" },
      ENGL1302: { name: "Rhetoric II", credits: 3, category: "Gen Ed", description: "Advanced writing.", prereq: ["ENGL1301"], days: "TR", time: "12:30 - 13:45", mode: "Hybrid", year: 1, term: "Spring" },
      COMM2301: { name: "Interpersonal Communication", credits: 3, category: "Major", description: "One-on-one communication dynamics.", prereq: ["COMM1301"], days: "MWF", time: "09:00 - 09:50", mode: "In-Person", year: 1, term: "Spring" },
      SOCI1301: { name: "Intro to Sociology", credits: 3, category: "Gen Ed", description: "Social structures and behavior.", prereq: [], days: "Online", time: "Asynchronous", mode: "Online", year: 1, term: "Spring" },
      MATH1342: { name: "Elementary Statistics", credits: 3, category: "Math & Science", description: "Statistical reasoning.", prereq: [], days: "MWF", time: "08:00 - 08:50", mode: "In-Person", year: 1, term: "Spring" },
      COMM2310: { name: "Media Writing", credits: 3, category: "Major", description: "Writing for media platforms.", prereq: ["COMM1301"], days: "TR", time: "11:00 - 12:15", mode: "In-Person", year: 2, term: "Fall" },
      COMM2320: { name: "Communication Theory", credits: 3, category: "Major", description: "Foundational theories.", prereq: ["COMM1301"], days: "MWF", time: "10:00 - 10:50", mode: "In-Person", year: 2, term: "Fall" },
      PSYC1300: { name: "Intro to Psychology", credits: 3, category: "Gen Ed", description: "Survey of the field.", prereq: [], days: "TR", time: "09:30 - 10:45", mode: "In-Person", year: 2, term: "Fall" },
      COMM3301: { name: "Digital Media Production", credits: 3, category: "Major", description: "Audio/video production basics.", prereq: ["COMM2310"], days: "TR", time: "13:00 - 14:15", mode: "In-Person", year: 2, term: "Spring" },
      COMM3310: { name: "Argumentation & Debate", credits: 3, category: "Major", description: "Reasoning and advocacy.", prereq: ["COMM1310"], days: "MWF", time: "11:00 - 11:50", mode: "In-Person", year: 2, term: "Spring" },
      COMM3320: { name: "Organizational Communication", credits: 3, category: "Major", description: "Communication within organizations.", prereq: ["COMM2320"], days: "MWF", time: "12:00 - 12:50", mode: "In-Person", year: 3, term: "Fall" },
      COMM3330: { name: "Media Ethics & Law", credits: 3, category: "Major", description: "Legal and ethical issues in media.", prereq: ["COMM2320"], days: "TR", time: "13:00 - 14:15", mode: "In-Person", year: 3, term: "Fall" },
      COMM3340: { name: "Strategic Public Relations", credits: 3, category: "Major", description: "PR campaign planning.", prereq: ["COMM2310"], days: "MWF", time: "13:00 - 13:50", mode: "In-Person", year: 3, term: "Spring" },
      COMM4301: { name: "Communication Research Methods", credits: 3, category: "Major", description: "Research design for comm studies.", prereq: ["COMM2320", "MATH1342"], days: "TR", time: "14:30 - 15:45", mode: "In-Person", year: 3, term: "Spring" },
      COMM4390: { name: "Selected Topics: Social Media Strategy", credits: 3, category: "Elective", description: "Rotating advanced topics.", prereq: ["COMM3301"], days: "MWF", time: "14:00 - 14:50", mode: "In-Person", year: 4, term: "Fall" },
      COMM4310: { name: "Crisis Communication", credits: 3, category: "Major", description: "Managing communication in crises.", prereq: ["COMM3320"], days: "TR", time: "13:00 - 14:15", mode: "In-Person", year: 4, term: "Fall" },
      COMM4498: { name: "Senior Capstone Portfolio", credits: 3, category: "Major", description: "Capstone professional portfolio.", prereq: ["COMM4301", "COMM3340"], days: "MWF", time: "12:00 - 12:50", mode: "In-Person", year: 4, term: "Spring" },
    },
  },
];

export function isEmpty() {
  const row = db.prepare("SELECT COUNT(*) AS n FROM programs").get();
  return row.n === 0;
}

export function seed({ force = false } = {}) {
  initSchema();

  if (!force && !isEmpty()) {
    return { seeded: false, reason: "already-seeded" };
  }

  transaction(() => {
    db.exec("DELETE FROM course_prereqs; DELETE FROM courses; DELETE FROM plans; DELETE FROM programs;");
  });

  const insertProgram = db.prepare(
    "INSERT INTO programs (code, name, description, degree_type) VALUES (@code, @name, @description, @degree_type)"
  );
  const insertCourse = db.prepare(
    `INSERT INTO courses (program_id, code, name, credits, description, days, time, mode, category, year_level, term)
     VALUES (@program_id, @code, @name, @credits, @description, @days, @time, @mode, @category, @year_level, @term)`
  );
  const insertPrereq = db.prepare(
    "INSERT INTO course_prereqs (course_id, prereq_code) VALUES (?, ?)"
  );

  const insertAll = () => transaction(() => {
    for (const program of PROGRAMS) {
      const { lastInsertRowid: programId } = insertProgram.run({
        code: program.code,
        name: program.name,
        description: program.description,
        degree_type: program.degree_type,
      });

      const codeToId = {};

      for (const [code, c] of Object.entries(program.courses)) {
        const { lastInsertRowid: courseId } = insertCourse.run({
          program_id: programId,
          code,
          name: c.name,
          credits: c.credits,
          description: c.description,
          days: c.days,
          time: c.time,
          mode: c.mode,
          category: c.category,
          year_level: c.year,
          term: c.term,
        });
        codeToId[code] = courseId;
      }

      for (const [code, c] of Object.entries(program.courses)) {
        for (const prereqCode of c.prereq) {
          insertPrereq.run(codeToId[code], prereqCode);
        }
      }
    }
  });
  insertAll();

  return { seeded: true, programs: PROGRAMS.length };
}

// Allow `node src/seedData.js --force` to reseed manually.
if (import.meta.url === `file://${process.argv[1]}`) {
  const force = process.argv.includes("--force");
  const result = seed({ force: true || force });
  console.log(result);
  process.exit(0);
}
