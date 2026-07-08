import { db, initSchema, transaction } from "./db.js";

/**
 * Seed catalog for two degree programs. Categories drive the requirement
 * progress bars on the frontend (Major / Math & Science / Gen Ed / Elective).
 */
const PROGRAMS = [
  {
    code: "CS-BS",
    name: "Computer Science, B.S.",
    degree_type: "B.S.",
    description: "Core computer science curriculum: programming, theory, systems, and a technical elective.",
    courses: {
      CS1411: { name: "Programming I", credits: 4, category: "Major", description: "Intro to programming.", prereq: [], days: "MWF", time: "09:00 - 09:50", mode: "In-Person" },
      CS1412: { name: "Programming II", credits: 4, category: "Major", description: "OOP and data structures.", prereq: ["CS1411"], days: "MWF", time: "10:00 - 10:50", mode: "In-Person" },
      CS1382: { name: "Discrete Structures", credits: 3, category: "Major", description: "Logic and graphs.", prereq: ["CS1411"], days: "TR", time: "11:00 - 12:15", mode: "In-Person" },
      CS2413: { name: "Data Structures", credits: 3, category: "Major", description: "Trees, lists, graphs.", prereq: ["CS1412"], days: "TR", time: "09:30 - 10:45", mode: "In-Person" },
      CS2365: { name: "OOP", credits: 3, category: "Major", description: "Advanced OOP.", prereq: ["CS2413"], days: "MWF", time: "11:00 - 11:50", mode: "In-Person" },
      CS3364: { name: "Algorithms", credits: 3, category: "Major", description: "Algorithm analysis.", prereq: ["CS2413", "CS1382"], days: "TR", time: "13:00 - 14:15", mode: "In-Person" },
      CS3375: { name: "Software Engineering", credits: 3, category: "Major", description: "Team software dev.", prereq: ["CS2365"], days: "MWF", time: "12:00 - 12:50", mode: "Hybrid" },
      CS3383: { name: "Automata Theory", credits: 3, category: "Major", description: "Formal languages.", prereq: ["CS3364"], days: "TR", time: "14:30 - 15:45", mode: "In-Person" },
      CS4352: { name: "Operating Systems", credits: 3, category: "Major", description: "OS internals.", prereq: ["CS3364"], days: "MWF", time: "13:00 - 13:50", mode: "In-Person" },
      CS4354: { name: "Database Systems", credits: 3, category: "Major", description: "SQL and DB design.", prereq: ["CS2413"], days: "Online", time: "Asynchronous", mode: "Online" },
      CS4390: { name: "Selected Topics: AI", credits: 3, category: "Elective", description: "Intro to machine learning and AI.", prereq: ["CS3364"], days: "TR", time: "16:00 - 17:15", mode: "In-Person" },
      MATH1451: { name: "Calculus I", credits: 4, category: "Math & Science", description: "Derivatives.", prereq: [], days: "MWF", time: "08:00 - 08:50", mode: "In-Person" },
      MATH1452: { name: "Calculus II", credits: 4, category: "Math & Science", description: "Integrals.", prereq: ["MATH1451"], days: "MWF", time: "09:00 - 09:50", mode: "In-Person" },
      PHYS1408: { name: "Physics I", credits: 4, category: "Math & Science", description: "Mechanics.", prereq: ["MATH1451"], days: "MWF", time: "14:00 - 14:50", mode: "In-Person" },
      PHYS2401: { name: "Physics II", credits: 4, category: "Math & Science", description: "Electricity.", prereq: ["PHYS1408", "MATH1452"], days: "MWF", time: "15:00 - 15:50", mode: "In-Person" },
      ENGL1301: { name: "Rhetoric I", credits: 3, category: "Gen Ed", description: "Composition.", prereq: [], days: "Online", time: "Asynchronous", mode: "Online" },
      ENGL1302: { name: "Rhetoric II", credits: 3, category: "Gen Ed", description: "Advanced writing.", prereq: ["ENGL1301"], days: "TR", time: "12:30 - 13:45", mode: "Hybrid" },
      UNIV1000: { name: "First-Year Seminar", credits: 1, category: "Gen Ed", description: "College success skills.", prereq: [], days: "MWF", time: "08:00 - 08:50", mode: "In-Person" },
      ARTS2301: { name: "Intro to Visual Arts", credits: 3, category: "Elective", description: "Art history and appreciation.", prereq: [], days: "TR", time: "10:00 - 11:15", mode: "In-Person" },
    },
  },
  {
    code: "BA-BBA",
    name: "Business Administration, B.B.A.",
    degree_type: "B.B.A.",
    description: "Foundational business curriculum spanning accounting, economics, finance, and management.",
    courses: {
      BUS1301: { name: "Intro to Business", credits: 3, category: "Major", description: "Foundations of business.", prereq: [], days: "MWF", time: "09:00 - 09:50", mode: "In-Person" },
      ACCT2301: { name: "Financial Accounting", credits: 3, category: "Major", description: "Financial statements and reporting.", prereq: [], days: "TR", time: "09:30 - 10:45", mode: "In-Person" },
      ACCT2302: { name: "Managerial Accounting", credits: 3, category: "Major", description: "Cost and decision accounting.", prereq: ["ACCT2301"], days: "TR", time: "11:00 - 12:15", mode: "In-Person" },
      ECON2301: { name: "Microeconomics", credits: 3, category: "Major", description: "Markets and firm behavior.", prereq: [], days: "MWF", time: "10:00 - 10:50", mode: "In-Person" },
      ECON2302: { name: "Macroeconomics", credits: 3, category: "Major", description: "National economies and policy.", prereq: ["ECON2301"], days: "MWF", time: "11:00 - 11:50", mode: "In-Person" },
      FIN3320: { name: "Corporate Finance", credits: 3, category: "Major", description: "Valuation and capital budgeting.", prereq: ["ACCT2301", "ECON2301"], days: "TR", time: "13:00 - 14:15", mode: "In-Person" },
      MKT3321: { name: "Principles of Marketing", credits: 3, category: "Major", description: "Markets, branding, and strategy.", prereq: ["BUS1301"], days: "MWF", time: "12:00 - 12:50", mode: "Hybrid" },
      MGT3322: { name: "Organizational Behavior", credits: 3, category: "Major", description: "People and management theory.", prereq: ["BUS1301"], days: "TR", time: "14:30 - 15:45", mode: "In-Person" },
      BUS4390: { name: "Strategic Management", credits: 3, category: "Major", description: "Capstone strategy course.", prereq: ["MKT3321", "MGT3322", "FIN3320"], days: "MWF", time: "13:00 - 13:50", mode: "In-Person" },
      BLAW3391: { name: "Business Law", credits: 3, category: "Elective", description: "Legal environment of business.", prereq: [], days: "Online", time: "Asynchronous", mode: "Online" },
      COMM2301: { name: "Public Speaking", credits: 3, category: "Elective", description: "Applied business communication.", prereq: [], days: "TR", time: "10:00 - 11:15", mode: "In-Person" },
      STAT2380: { name: "Business Statistics", credits: 3, category: "Math & Science", description: "Statistical methods for business.", prereq: [], days: "MWF", time: "08:00 - 08:50", mode: "In-Person" },
      MATH1324: { name: "Business Calculus", credits: 3, category: "Math & Science", description: "Applied calculus for business.", prereq: [], days: "MWF", time: "09:00 - 09:50", mode: "In-Person" },
      ENGL1301: { name: "Rhetoric I", credits: 3, category: "Gen Ed", description: "Composition.", prereq: [], days: "Online", time: "Asynchronous", mode: "Online" },
      ENGL1302: { name: "Rhetoric II", credits: 3, category: "Gen Ed", description: "Advanced writing.", prereq: ["ENGL1301"], days: "TR", time: "12:30 - 13:45", mode: "Hybrid" },
      UNIV1000: { name: "First-Year Seminar", credits: 1, category: "Gen Ed", description: "College success skills.", prereq: [], days: "MWF", time: "08:00 - 08:50", mode: "In-Person" },
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
    `INSERT INTO courses (program_id, code, name, credits, description, days, time, mode, category)
     VALUES (@program_id, @code, @name, @credits, @description, @days, @time, @mode, @category)`
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
