# Weekly Schedule Web Application

## Overview
This web application allows students to upload an Excel file containing class information and generate a visual, editable weekly schedule. It is designed to simplify the scheduling process through automation, visual clarity, and user-friendly features.

---

## Features
- Excel upload to import class data
- Drag-and-drop interface for editing class times and days
- Real-time clash detection with visual alerts
- Search and filter functionality to locate classes quickly
- Editable class list with add, edit, and delete options
- Export final schedule as a downloadable PNG image
- Desktop-optimized layout for widescreen and mouse input

---

## Architecture
The application uses a modular, layered design for scalability and maintainability.

### Interface Layer
- **Schedule Table:** Displays a visual, interactive weekly schedule.
- **Class List:** Lists all classes and allows user editing.
- **Search Bar:** Filters class data and passes it to other components.
- **Upload Button:** Imports data from an Excel file.
- **Download Button:** Exports the visual schedule as an image.

### Application Logic Layer
- **Clash Detection:** Identifies and highlights overlapping classes.
- **Normalization Module:** Extracts relevant class fields from Excel data.
- **FilterClasses:** Prepares class data for use in other modules.
- **Auto Scheduler:** Automatically places classes on the schedule table.

### Data Storage Layer
- **MySQL Database:** Stores normalized class data for reliable retrieval and interface updates.

---

## Core Modules
- **Upload Module:** Reads and normalizes data from the Excel file, then stores it in the database.
- **Search and Filter Module:** Allows users to search for classes by code or name and filter results for display.
- **Schedule Display Module:** Provides a visual representation of the schedule and enables drag-and-drop editing.
- **Conflict Management Module:** Detects and alerts users to schedule conflicts using the `isClashing` function.
- **Export Module:** Converts the final schedule into a PNG image for download.

---

## User-Centered Design Choices
- **Drag-and-Drop:** Enables users to intuitively adjust class times without manual input.
- **Clash Warnings:** Provides immediate feedback when scheduling conflicts occur.
- **Clean Layout:** Separates input areas (search bar, class list) from the visual schedule for clarity.
- **Device Focus:** Optimized for desktop users with widescreen layouts and mouse interaction.

---

## Technologies Used
- HTML
- CSS
- JavaScript
- MySQL (for data storage)
- XLSX.js (for Excel file processing)
- Drag and Drop API
- dom-to-image (for schedule export)

---

## Getting Started
1. Clone the repository
2. Install dependencies
3. Start the server (e.g., using `npm start`)
4. Open the application in your browser at http://localhost:3000

---

## Notes
- Ensure Excel files follow the expected format: class name, day, start time, end time, and location.
- Schedule conflict detection requires up-to-date data in the interface.
