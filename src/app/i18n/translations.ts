// All user-facing text lives here, once per language.
// Use {name}-style placeholders for dynamic values: t("key", { name: "x" }).
// The `tr` object is typed as `typeof en`, so TypeScript errors if a key is missing.

const en = {
  headerTitle: "Weekly Schedule",

  // Landing page
  landingTitle: "Weekly Schedule",
  keyFeatures: "Key Features",
  feat1: "Upload Excel files containing class information",
  feat2: "Drag and drop classes into a visual weekly schedule",
  feat3: "Automatic clash detection and visual conflict warnings",
  feat4: "Edit, remove, or add new sessions and courses easily",
  howToUse: "How to Use",
  step1: "Upload your Excel file with class data using the file uploader.",
  step1Hint: "You can find the Excel file on the Grand Library website.",
  step2: "Search for classes using the search bar, then add them to your schedule.",
  step2Hint: `if you can't find your class, check the uzbim website the class could be online, or not on the schudle yet, wait for an update.`,
  step3: "Drag and drop classes into the weekly grid as needed.",
  step4: "Use the class list to edit, remove, or add new sessions or courses.",
  step4Hint: "make sure the classes are on an 1 hour interval.",
  step5: "Watch for clash warnings — they help prevent scheduling conflicts.",
  getStarted: "Get Started",

  // Schedule page / table clash messages
  clashConflict: `"{name}" on {day} at {time} conflicts with "{other}" ({start}–{end})`,
  clashWith: "Clash with: {list}",
  clashItem: `"{name}" at {start}–{end}`,
  clashDetected: "Clash detected",

  // Class list
  classList: "Class List",
  addCourse: "Add Course",
  courseName: "Course Name",
  dayLabel: "Day",
  location: "Location",
  save: "Save",
  cancel: "Cancel",
  noClasses: "No classes to display.",
  addSession: "Add Session",
  removeAll: "Remove All",
  edit: "Edit",
  removeSession: "Remove Session",
  locationLabel: "(Location: {loc})",
  none: "(none)",
  errStartRange: "Start time must be between 08:30 and 17:30.",
  errEndRange: "End time must be between 08:30 and 17:30.",
  errStartBeforeEnd: "Start time must be earlier than end time.",
  errDuration: "Class duration cannot be more than 1 hour.",
  errStartInterval: "Start time must be a valid 30-minute interval (e.g., 08:00, 08:30).",
  errEndInterval: "End time must be a valid 30-minute interval (e.g., 08:00, 08:30).",
  editConflict: "This class conflicts with another, but changes are allowed.",
  fillAll: "Please fill in all fields.",
  fillAllSession: "Please fill in all fields for the new session.",
  fillAllCourse: "Please fill in all fields to add a course.",

  // Search bar
  searchPlaceholder: "Search for a class...",
  matches: "{n} match(es)",

  // Download
  downloadSchedule: "Download Schedule",
  dlNotFound: "Schedule area not found.",
  dlPopup: "Please allow pop-ups to save the schedule image.",
  dlHold: `Press and hold the image, then choose "Save Image"`,
  dlError: "Something went wrong while capturing the schedule.",

  // Excel / PDF upload
  uploadFile: "Upload Timetable File",
  dragDrop: "Drag & drop your timetable file",
  dropHere: "Drop it here",
  fileTypes: ".xlsx, .xls, or .pdf",
  uploadDifferent: "Upload a different file",
  msgInvalidFile: "Please drop a valid .xlsx, .xls, or .pdf file.",
  msgPdfFail: "Failed to read PDF file.",
  msgExcelFail: "Failed to read Excel file.",
  msgUploadOk: "upload successful.",

  // AI assistant
  aiTitle: "AI Timetable Assistant",
  aiSubtitle: "Near East University · AII Department",
  aiClasses: "✓ {n} classes",
  aiNoFile: "No file yet",
  aiClashOne: "⚠️ {n} clash",
  aiClashMany: "⚠️ {n} clashes",
  aiGreeting: `Hi 👋 Upload your Excel file, then type your course codes and I'll build your timetable!\n\nI understand groups — just say:\n"AII 108, MTH 201"\nand I'll show you all available groups.`,
  aiPlaceholderData: "e.g. AII 108, MTH 201  or  remove PHY 102",
  aiPlaceholderNoData: "Upload Excel file first...",
  aiYesRemove: "✅ Yes, remove it",
  aiNoKeep: "❌ No, keep it",
  aiUserYes: "Yes, remove it",
  aiUserNo: "No, keep it",
  aiRemoved: `✅ Done! "{name}" has been removed. Your schedule is clash-free now 🎉`,
  aiKept: "Got it! The class stays. Let me know if you need anything else.",
  groupSuffix: " (Group {g})",
  aiClashMsg: `⚠️ Clash detected!\n\n"{a}"{ga} on {da} {sa}–{ea} overlaps with "{b}"{gb} on {db} {sb}–{eb}.\n\nWould you like me to remove "{a}" to fix this?`,
  aiError: "Something went wrong. Please try again.",
  aiPickGroup: `"{course}" has more than one group, and I can only add one. Which one do you want?\n{options}`,
  aiAddedNow: "Added: {list}.",
  aiNotFound: `I couldn't find "{list}" in your file.`,
  groupWord: "Group",
  aiSorry: "Sorry, something went wrong.",

  days: {
    Monday: "Monday",
    Tuesday: "Tuesday",
    Wednesday: "Wednesday",
    Thursday: "Thursday",
    Friday: "Friday",
    Saturday: "Saturday",
    Sunday: "Sunday",
  },
  daysShort: {
    MON: "MON",
    TUE: "TUE",
    WED: "WED",
    THU: "THU",
    FRI: "FRI",
  },
}

const tr: typeof en = {
  headerTitle: "Haftalık Ders Programı",

  // Landing page
  landingTitle: "Haftalık Ders Programı",
  keyFeatures: "Temel Özellikler",
  feat1: "Ders bilgilerini içeren Excel dosyalarını yükle",
  feat2: "Dersleri sürükleyip bırakarak görsel haftalık programa yerleştir",
  feat3: "Otomatik çakışma tespiti ve görsel çakışma uyarıları",
  feat4: "Ders saatlerini ve dersleri kolayca düzenle, kaldır veya ekle",
  howToUse: "Nasıl Kullanılır",
  step1: "Dosya yükleyiciyi kullanarak ders verilerini içeren Excel dosyanı yükle.",
  step1Hint: "Excel dosyasını Grand Library web sitesinde bulabilirsin.",
  step2: "Arama çubuğuyla dersleri ara, sonra programına ekle.",
  step2Hint: "Dersini bulamazsan uzbim web sitesine bak; ders çevrimiçi olabilir ya da henüz programa eklenmemiş olabilir, güncellemeyi bekle.",
  step3: "Dersleri gerektiği gibi haftalık tabloya sürükleyip bırak.",
  step4: "Ders listesini kullanarak ders saatlerini veya dersleri düzenle, kaldır ya da yeni ekle.",
  step4Hint: "Derslerin 1 saatlik aralıklarla olduğundan emin ol.",
  step5: "Çakışma uyarılarına dikkat et — program çakışmalarını önlemene yardımcı olurlar.",
  getStarted: "Başla",

  // Schedule page / table clash messages
  clashConflict: `{day} günü {time} saatindeki "{name}" dersi "{other}" ile çakışıyor ({start}–{end})`,
  clashWith: "Çakışan dersler: {list}",
  clashItem: `"{name}" ({start}–{end})`,
  clashDetected: "Çakışma var",

  // Class list
  classList: "Ders Listesi",
  addCourse: "Ders Ekle",
  courseName: "Ders Adı",
  dayLabel: "Gün",
  location: "Yer",
  save: "Kaydet",
  cancel: "İptal",
  noClasses: "Gösterilecek ders yok.",
  addSession: "Ders Saati Ekle",
  removeAll: "Tümünü Kaldır",
  edit: "Düzenle",
  removeSession: "Saati Kaldır",
  locationLabel: "(Yer: {loc})",
  none: "(yok)",
  errStartRange: "Başlangıç saati 08:30 ile 17:30 arasında olmalı.",
  errEndRange: "Bitiş saati 08:30 ile 17:30 arasında olmalı.",
  errStartBeforeEnd: "Başlangıç saati bitiş saatinden önce olmalı.",
  errDuration: "Ders süresi 1 saatten uzun olamaz.",
  errStartInterval: "Başlangıç saati 30 dakikalık aralıklarla olmalı (örn. 08:00, 08:30).",
  errEndInterval: "Bitiş saati 30 dakikalık aralıklarla olmalı (örn. 08:00, 08:30).",
  editConflict: "Bu ders başka bir dersle çakışıyor, ancak değişikliğe izin verilir.",
  fillAll: "Lütfen tüm alanları doldur.",
  fillAllSession: "Lütfen yeni ders saati için tüm alanları doldur.",
  fillAllCourse: "Ders eklemek için lütfen tüm alanları doldur.",

  // Search bar
  searchPlaceholder: "Ders ara...",
  matches: "{n} sonuç",

  // Download
  downloadSchedule: "Programı İndir",
  dlNotFound: "Program alanı bulunamadı.",
  dlPopup: "Program görselini kaydetmek için lütfen açılır pencerelere izin ver.",
  dlHold: `Görsele basılı tut, ardından "Görseli Kaydet"i seç`,
  dlError: "Program görseli oluşturulurken bir sorun oluştu.",

  // Excel / PDF upload
  uploadFile: "Ders Programı Dosyası Yükle",
  dragDrop: "Ders programı dosyanı sürükleyip bırak",
  dropHere: "Buraya bırak",
  fileTypes: ".xlsx, .xls veya .pdf",
  uploadDifferent: "Başka bir dosya yükle",
  msgInvalidFile: "Lütfen geçerli bir .xlsx, .xls veya .pdf dosyası bırak.",
  msgPdfFail: "PDF dosyası okunamadı.",
  msgExcelFail: "Excel dosyası okunamadı.",
  msgUploadOk: "Yükleme başarılı.",

  // AI assistant
  aiTitle: "Yapay Zeka Ders Programı Asistanı",
  aiSubtitle: "Yakın Doğu Üniversitesi · AII Bölümü",
  aiClasses: "✓ {n} ders",
  aiNoFile: "Henüz dosya yok",
  aiClashOne: "⚠️ {n} çakışma",
  aiClashMany: "⚠️ {n} çakışma",
  aiGreeting: `Merhaba 👋 Excel dosyanı yükle, sonra ders kodlarını yaz; ders programını ben hazırlayayım!\n\nGrupları anlıyorum — şunu yazman yeterli:\n"AII 108, MTH 201"\nve ben sana mevcut tüm grupları göstereyim.`,
  aiPlaceholderData: "örn. AII 108, MTH 201  veya  PHY 102 sil",
  aiPlaceholderNoData: "Önce Excel dosyasını yükle...",
  aiYesRemove: "✅ Evet, kaldır",
  aiNoKeep: "❌ Hayır, kalsın",
  aiUserYes: "Evet, kaldır",
  aiUserNo: "Hayır, kalsın",
  aiRemoved: `✅ Tamam! "{name}" kaldırıldı. Programında artık çakışma yok 🎉`,
  aiKept: "Tamam! Ders kalıyor. Başka bir şeye ihtiyacın olursa söyle.",
  groupSuffix: " (Grup {g})",
  aiClashMsg: `⚠️ Çakışma tespit edildi!\n\n"{a}"{ga}, {da} {sa}–{ea} saatlerinde "{b}"{gb} ({db} {sb}–{eb}) ile çakışıyor.\n\nBunu çözmek için "{a}" dersini kaldırmamı ister misin?`,
  aiError: "Bir şeyler ters gitti. Lütfen tekrar dene.",
  aiPickGroup: `"{course}" dersinin birden fazla grubu var ve yalnızca birini ekleyebilirim. Hangisini istersin?\n{options}`,
  aiAddedNow: "Eklendi: {list}.",
  aiNotFound: `"{list}" dosyanda bulunamadı.`,
  groupWord: "Grup",
  aiSorry: "Üzgünüm, bir şeyler ters gitti.",

  days: {
    Monday: "Pazartesi",
    Tuesday: "Salı",
    Wednesday: "Çarşamba",
    Thursday: "Perşembe",
    Friday: "Cuma",
    Saturday: "Cumartesi",
    Sunday: "Pazar",
  },
  daysShort: {
    MON: "PZT",
    TUE: "SAL",
    WED: "ÇAR",
    THU: "PER",
    FRI: "CUM",
  },
}

export const translations = { en, tr }

export type Lang = keyof typeof translations
export type TranslationKey = Exclude<keyof typeof en, "days" | "daysShort">
