



# Smart Degree Planner

A modern, interactive **React + Vite degree planning web app** that helps students:

✅ Plan semesters automatically  
✅ Respect course prerequisites  
✅ Detect schedule conflicts  
✅ Track graduation progress  
✅ Mark completed courses  
✅ Add / edit / delete courses  
✅ Choose number of classes per semester  

Built as a professional academic scheduling tool.

---

# Features

- Full course catalog
-  Degree progress bar (credits completed vs required)
- Auto scheduler using prerequisite graph (topological sort)
-  Time conflict detection
- Course editor (add/edit/delete)
-  Mark courses as completed
-  Color-coded departments (CS, MATH, PHYS, ENGL)
- Semester-by-semester planner
- Deployable to Vercel / Netlify

---

#  Tech Stack

- React
- Vite
- JavaScript
- CSS
- Graph algorithms (topological sort)

---



# Deploy Online (Recommended)


smart-degree-planner-czkh.vercel.app

---



# Project Structure

```
smart-degree-planner/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.jsx
│   │   │   ├── PlannerBoard.jsx
│   │   │   ├── CourseDetails.jsx
│   │   │   └── CourseCard.jsx
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── main.jsx
│   │
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
```

---

#  How Scheduling Works

The planner uses:

### Topological Sort
- Ensures prerequisites are taken first

### Conflict Detection
- Checks overlapping days/times

### Credit Tracking
- Calculates completed + planned credits
- Shows graduation progress

---

# Example Usage

1. Mark completed courses on the left
2. Choose max classes per semester
3. Click **Generate Plan**
4. View semesters automatically created
5. Edit courses anytime

---

#  Author

Andreea Lila  
Computer Science Student  

---


