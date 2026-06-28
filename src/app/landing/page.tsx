"use client"

import Link from "next/link"

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-blue-50 flex flex-col items-center justify-start pt-24 pb-16 px-6">
      <div className="max-w-3xl mx-auto text-center space-y-10">
        <h1 className="text-5xl font-extrabold text-gray-900">
          Weekly Schedule
        </h1>

        {/* Features Section */}
        <section className="mt-12 space-y-6 text-left">
          <h2 className="text-2xl font-semibold text-gray-800">Key Features</h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
            <li className="p-4 bg-white rounded shadow">
              Upload Excel files containing class information
            </li>
            <li className="p-4 bg-white rounded shadow">
              Drag and drop classes into a visual weekly schedule
            </li>
            <li className="p-4 bg-white rounded shadow">
              Automatic clash detection and visual conflict warnings
            </li>
            <li className="p-4 bg-white rounded shadow">
              Edit, remove, or add new sessions and courses easily
            </li>
          </ul>
        </section>

        {/* Instructions Section */}
        <section className="mt-12 space-y-6 text-left">
          <h2 className="text-2xl font-semibold text-gray-800">How to Use</h2>
          <ol className="list-decimal list-inside space-y-3 text-sm text-gray-700 bg-white p-6 rounded shadow">
            <li>
              Upload your Excel file with class data using the file uploader.
              <div className="text-gray-500 text-xs mt-1">
                You can find the Excel file on the Grand Library website.
              </div>
            </li>
            <li>
              Search for classes using the search bar, then add them to your schedule.
              <div className="text-gray-500 text-xs mt-1">
                if you can't find your class, check the uzbim website the class could be online, or not on the schudle yet, wait for an update.
              </div>
            </li>
            <li>
              Drag and drop classes into the weekly grid as needed.
            </li>
            <li>
              Use the class list to edit, remove, or add new sessions or courses.
              <div className="text-gray-500 text-xs mt-1">
                make sure the classes are on an 1 hour interval.
              </div>
            </li>
            <li>
              Watch for clash warnings — they help prevent scheduling conflicts.
            </li>
          </ol>
        </section>
        <Link
          href="/schedule"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md shadow hover:bg-blue-700 transition"
        >
          Get Started
        </Link>
      </div>
    </main>
  )
}