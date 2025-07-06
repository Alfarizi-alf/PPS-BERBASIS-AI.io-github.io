// script.js

const { useState, useCallback, useEffect } = React;
const { UploadCloud, FileText, BrainCircuit, LoaderCircle, AlertTriangle, ChevronRight, CheckCircle, ArrowRight, Download, Lightbulb, Zap, XCircle } = lucide;

// --- Firebase Initialization ---
const { initializeApp } = window.firebaseApp;
const { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } = window.firebaseAuth;
const { getFirestore, doc, getDoc, setDoc, onSnapshot, collection, query, where, addDoc, getDocs, updateDoc } = window.firebaseFirestore;

// Custom Alert/Message Modal Component
const MessageModal = ({ message, type, onClose }) => {
  if (!message) return null;

  const bgColor = type === 'error' ? 'bg-red-800' : 'bg-blue-800';
  const textColor = type === 'error' ? 'text-red-100' : 'text-blue-100';
  const borderColor = type === 'error' ? 'border-red-700' : 'border-blue-700';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`rounded-lg shadow-xl p-6 border ${bgColor} ${borderColor} max-w-sm w-full mx-auto animate-fade-in`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className={`text-lg font-bold ${textColor}`}>Pesan</h3>
          <button onClick={onClose} className="text-white hover:text-gray-300">
            <XCircle className="w-6 h-6" />
          </button>
        </div>
        <p className={`text-sm ${textColor} mb-4`}>{message}</p>
        <div className="text-right">
          <button onClick={onClose} className="px-4 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-500 transition-colors duration-200">
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

// Main App Component
function App() {
  const [apiKey, setApiKey] = useState('');
  const [rawData, setRawData] = useState(null);
  const [groupedData, setGroupedData] = useState(null);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [loadingStates, setLoadingStates] = useState({});
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState('xlsx');
  const [openStates, setOpenStates] = useState({});
  const [aiSummary, setAiSummary] = useState('');
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [generationProgress, setGenerationProgress] = useState({ current: 0, total: 0, message: '' });
  const [documentInventory, setDocumentInventory] = useState(null);
  const [groupedDocumentsByTypeForDisplay, setGroupedDocumentsByTypeForDisplay] = useState(null);
  const [isApiKeyInvalid, setIsApiKeyInvalid] = useState(false);
  const [showDocumentInventory, setShowDocumentInventory] = useState(false);
  const [showDocumentGrouping, setShowDocumentGrouping] = useState(false);
  const [modalMessage, setModalMessage] = useState({ message: '', type: '' });
  const [batchResult, setBatchResult] = useState(null);

  // Firebase State
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // --- Firebase Initialization and Auth ---
  useEffect(() => {
    try {
      const firebaseConfigStr = typeof __firebase_config !== 'undefined' ? __firebase_config : null;
      if (!firebaseConfigStr) {
        console.error("Firebase config not found. Persistence will not work.");
        setModalMessage({ message: "Konfigurasi Firebase tidak ditemukan. Fitur penyimpanan data tidak akan berfungsi.", type: 'error' });
        setIsAuthReady(true);
        return;
      }
      const firebaseConfig = JSON.parse(firebaseConfigStr);
      const app = initializeApp(firebaseConfig);
      const firestoreDb = getFirestore(app);
      const authInstance = getAuth(app);
      
      setDb(firestoreDb);
      setAuth(authInstance);

      const unsubscribe = onAuthStateChanged(authInstance, async (user) => {
        if (user) {
          setUserId(user.uid);
          console.log("Authenticated user:", user.uid);
        } else {
          try {
            const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
            if (initialAuthToken) {
              await signInWithCustomToken(authInstance, initialAuthToken);
            } else {
              await signInAnonymously(authInstance);
            }
          } catch (authError) {
            console.error("Firebase Auth Error:", authError);
            setModalMessage({ message: `Gagal otentikasi Firebase: ${authError.message}`, type: 'error' });
          }
        }
        setIsAuthReady(true);
      });

      return () => unsubscribe();
    } catch (e) {
      console.error("Error initializing Firebase:", e);
      setModalMessage({ message: `Gagal menginisialisasi Firebase: ${e.message}`, type: 'error' });
      setIsAuthReady(true);
    }
  }, []);

  // --- Firestore Data Persistence (Debounced) ---
  const saveToFirestore = useCallback(async (dataToSave, currentFileName, currentUserId) => {
    if (!db || !currentUserId || !currentFileName) return;
    if (Object.keys(dataToSave).length === 0 && !aiSummary) return;
    
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    const docRef = doc(db, `artifacts/${appId}/users/${currentUserId}/pps_data`, currentFileName);
    
    try {
      await setDoc(docRef, {
        groupedData: dataToSave,
        aiSummary: aiSummary,
        timestamp: new Date(),
      }, { merge: true });
      console.log("Data saved to Firestore!");
    } catch (e) {
      console.error("Error saving to Firestore:", e);
      setError(`Gagal menyimpan ke cloud: ${e.message}`);
    }
  }, [db, aiSummary]);

  useEffect(() => {
    if (isAuthReady && userId && fileName && groupedData) {
      const handler = setTimeout(() => {
        saveToFirestore(groupedData, fileName, userId);
      }, 1500);
      return () => clearTimeout(handler);
    }
  }, [groupedData, aiSummary, userId, fileName, isAuthReady, saveToFirestore]);

  const toggleOpen = (id) => setOpenStates(prev => ({ ...prev, [id]: !prev[id] }));

  // --- Data Processing Logic ---
  const processData = (data) => {
    const groups = {};
    data.forEach((row, index) => {
      const cleanedRow = Object.keys(row).reduce((acc, key) => {
          acc[key.trim().toLowerCase().replace(/\s+/g, '')] = row[key];
          return acc;
      }, {});
      
      const codeKey = Object.keys(cleanedRow).find(k => k.includes('babstandarkriteriaelemenpenilaian') || k.includes('kodeep') || k.includes('kode'));
      if (!codeKey || !cleanedRow[codeKey]) return;

      const code = String(cleanedRow[codeKey]);
      const parts = code.split('.');
      if (parts.length < 4) return;
      
      const [bab, standar, kriteria, ...epParts] = parts;
      const ep = epParts.join('.');

      if (!groups[bab]) groups[bab] = { title: `BAB ${bab}`, standards: {} };
      if (!groups[bab].standards[standar]) groups[bab].standards[standar] = { title: `Standar ${standar}`, criterias: {} };
      if (!groups[bab].standards[standar].criterias[kriteria]) {
        groups[bab].standards[standar].criterias[kriteria] = { title: `Kriteria ${kriteria}`, items: [] };
      }
      
      const itemData = {
        id: `${code}-${index}`,
        kode_ep: code,
        uraian_ep: cleanedRow['uraianelemenpenilaian'] || '',
        rekomendasi_survey: cleanedRow['rekomendasihasilsurvey'] || '',
        rencana_perbaikan: cleanedRow['rencanaperbaikan'] || '',
        indikator: cleanedRow['indikatorpencapaian'] || cleanedRow['indikator'] || '',
        sasaran: cleanedRow['sasaran'] || '',
        waktu: cleanedRow['waktupenyelesaian'] || cleanedRow['waktu'] || '',
        pj: cleanedRow['penanggungjawab'] || cleanedRow['pj'] || '',
        keterangan: "Klik 'Buat Keterangan'",
      };
      groups[bab].standards[standar].criterias[kriteria].items.push(itemData);
    });
    return groups;
  };

  const onDrop = useCallback((acceptedFiles) => {
    setError(''); setRawData(null); setGroupedData(null); setFileName(''); setAiSummary(''); setDocumentInventory(null); setGroupedDocumentsByTypeForDisplay(null); setIsApiKeyInvalid(false); setShowDocumentInventory(false); setShowDocumentGrouping(false); setModalMessage({ message: '', type: '' }); setBatchResult(null);
    setIsProcessingFile(true);
    const file = acceptedFiles[0];
    if (!file) { setModalMessage({ message: "File tidak valid.", type: 'error' }); setIsProcessingFile(false); return; }
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const workbook = XLSX.read(event.target.result, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {defval: ""});
        if(jsonData.length === 0) { 
          setModalMessage({ message: "File Excel kosong atau formatnya tidak bisa dibaca.", type: 'error' }); 
          setRawData(null);
          return; 
        }
        setRawData(jsonData);
      } catch (e) { 
        setModalMessage({ message: "Terjadi kesalahan saat memproses file Excel.", type: 'error' });
      } finally { 
        setIsProcessingFile(false); 
      }
    };
    reader.onerror = () => { 
      setModalMessage({ message: "Gagal membaca file.", type: 'error' }); 
      setIsProcessingFile(false); 
    }
    reader.readAsBinaryString(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'], 'text/csv': ['.csv'] }, disabled: isProcessingFile });

  useEffect(() => {
    const loadAndProcess = async () => {
      if (!rawData || !isAuthReady || !userId || !db || !fileName) return;

      setGenerationProgress({ current: 0, total: 0, message: 'Memproses data dan memuat dari cloud...' });
      setError('');

      try {
        let processedData = processData(rawData);
        if (Object.keys(processedData).length === 0) {
            setError("Data tidak dapat diproses.");
            setRawData(null); 
            setGenerationProgress({ current: 0, total: 0, message: '' });
            return;
        }

        const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
        const docRef = doc(db, `artifacts/${appId}/users/${userId}/pps_data`, fileName);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const savedData = docSnap.data();
          const savedGroupedData = savedData.groupedData;
          const savedAiSummary = savedData.aiSummary;

          for (const babKey in processedData) {
            if (savedGroupedData?.[babKey]) {
              for (const stdKey in processedData[babKey].standards) {
                if (savedGroupedData[babKey].standards?.[stdKey]) {
                  for (const kriKey in processedData[babKey].standards[stdKey].criterias) {
                    if (savedGroupedData[babKey].standards[stdKey].criterias?.[kriKey]) {
                      processedData[babKey].standards[stdKey].criterias[kriKey].items = 
                        processedData[babKey].standards[stdKey].criterias[kriKey].items.map(newItem => {
                          const existingItem = savedGroupedData[babKey].standards[stdKey].criterias[kriKey].items.find(si => si.id === newItem.id);
                          return existingItem ? { ...newItem, ...existingItem } : newItem;
                        });
                    }
                  }
                }
              }
            }
          }
          setAiSummary(savedAiSummary || '');
        }
        setGroupedData(processedData);
        setGenerationProgress({ current: 0, total: 0, message: '' });
      } catch (e) { 
        setError("Terjadi kesalahan saat membuat hierarki atau memuat data."); 
        setGenerationProgress({ current: 0, total: 0, message: '' });
      }
    };

    if (rawData && isAuthReady && userId && db && fileName) {
      loadAndProcess();
    }
  }, [rawData, userId, db, isAuthReady, fileName]);

  const updateItemState = useCallback((itemId, field, value) => {
    setGroupedData(prev => {
      if (!prev) return prev;
      const newGroupedData = JSON.parse(JSON.stringify(prev));
      for (const babKey in newGroupedData) {
        for (const stdKey in newGroupedData[babKey].standards) {
          for (const kriKey in newGroupedData[babKey].standards[stdKey].criterias) {
            const itemIndex = newGroupedData[babKey].standards[stdKey].criterias[kriKey].items.findIndex(i => i.id === itemId);
            if (itemIndex > -1) {
              newGroupedData[babKey].standards[stdKey].criterias[kriKey].items[itemIndex][field] = value;
              return newGroupedData;
            }
          }
        }
      }
      return prev;
    });
  }, []);

  // --- AI and API Functions ---
  const callAiApi = async (prompt) => {
    if (!apiKey) {
      setIsApiKeyInvalid(true);
      throw new Error("API_KEY_MISSING");
    }
    setIsApiKeyInvalid(false);
    
    const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };
    let response;
    try {
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
        response = await fetch(apiUrl, { 
            method: 'POST', 
            mode: 'cors',
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify(payload) 
        });
    } catch (networkError) {
        throw new Error("NETWORK_ERROR");
    }

    if (!response.ok) {
      const errorBody = await response.json();
      if (response.status === 429) return 'RATE_LIMIT';
      if (response.status === 400 && errorBody?.error?.message.includes("API key not valid")) {
        setIsApiKeyInvalid(true);
        throw new Error("API_KEY_INVALID");
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
        return result.candidates[0].content.parts[0].text.trim().replace(/^"|"$/g, '');
    }
    return "Respons AI tidak valid.";
  };

  const handleApiError = (e) => {
    let message = `Gagal menghubungi AI: ${e.message}`;
    if (e.message === "API_KEY_INVALID") message = "Kunci API tidak valid.";
    else if (e.message === "API_KEY_MISSING") message = "Harap masukkan Kunci API Google AI Anda.";
    else if (e.message === "NETWORK_ERROR") message = "Gagal terhubung ke server AI. Periksa koneksi internet.";
    setModalMessage({ message, type: 'error' });
  };

  const cleanAiInput = (text) => {
    if (typeof text !== 'string') text = String(text || '');
    const cleaned = text.trim();
    if (['Klik \'Buat Keterangan\'', 'Gagal diproses', 'Input data tidak siap', 'Batas permintaan AI tercapai', 'Data tidak cukup', 'Gagal setelah beberapa percobaan'].some(msg => cleaned.includes(msg))) {
        return '';
    }
    return cleaned;
  };

  const createAIGenerationHandler = (config) => async (item) => {
    const { id } = item;
    const { field, loadingSuffix, prompt, preCondition, preConditionMessage } = config;

    if (preCondition && !preCondition(item)) {
        updateItemState(id, field, preConditionMessage);
        return;
    }

    setLoadingStates(prev => ({ ...prev, [`${id}_${loadingSuffix}`]: true }));

    let success = false;
    let attempts = 0;
    const MAX_ATTEMPTS = 3;
    const RETRY_DELAY_MS = 2000;

    while (!success && attempts < MAX_ATTEMPTS) {
        try {
            const generatedText = await callAiApi(prompt(item));
            if (generatedText === 'RATE_LIMIT') {
                attempts++;
                updateItemState(id, field, `Batas permintaan AI tercapai, mencoba lagi... (${attempts}/${MAX_ATTEMPTS})`);
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
                continue;
            }
            updateItemState(id, field, generatedText);
            success = true;
        } catch (e) {
            handleApiError(e);
            updateItemState(id, field, `Gagal diproses: ${e.message}`);
            success = true; // Stop retrying on non-rate-limit errors
        }
    }

    if (!success) {
        updateItemState(id, field, 'Gagal setelah beberapa percobaan (Rate Limit)');
    }
    setLoadingStates(prev => ({ ...prev, [`${id}_${loadingSuffix}`]: false }));
  };

  const handleGenerateKeterangan = createAIGenerationHandler({
    field: 'keterangan',
    loadingSuffix: 'ket',
    preCondition: item => cleanAiInput(item.rencana_perbaikan) || cleanAiInput(item.indikator) || cleanAiInput(item.sasaran),
    preConditionMessage: 'Input data tidak siap (isi RTL/Indikator/Sasaran)',
    prompt: item => `PERAN: Anda adalah auditor akreditasi. TUGAS: Buatkan satu judul DOKUMEN BUKTI IMPLEMENTASI yang konkret berdasarkan data berikut. DATA: - Rencana Perbaikan: "${cleanAiInput(item.rencana_perbaikan)}" - Indikator: "${cleanAiInput(item.indikator)}" - Sasaran: "${cleanAiInput(item.sasaran)}". ATURAN: Jawaban harus berupa satu frasa/kalimat tunggal, spesifik, dan dalam format nama dokumen resmi.`
  });
  
  const handleGenerateRTL = createAIGenerationHandler({
    field: 'rencana_perbaikan',
    loadingSuffix: 'rtl',
    preCondition: item => cleanAiInput(item.uraian_ep) || cleanAiInput(item.rekomendasi_survey),
    preConditionMessage: 'Data tidak cukup untuk ide RTL',
    prompt: item => `PERAN: Anda adalah konsultan mutu. TUGAS: Buatkan satu kalimat RENCANA PERBAIKAN (RTL) yang operasional dan terukur. DATA: - Uraian Elemen Penilaian: "${cleanAiInput(item.uraian_ep)}" - Rekomendasi Awal: "${cleanAiInput(item.rekomendasi_survey)}". ATURAN: Jawaban harus berupa kalimat tindakan yang jelas.`
  });

  const handleGenerateIndikator = createAIGenerationHandler({
    field: 'indikator',
    loadingSuffix: 'indikator',
    preCondition: item => cleanAiInput(item.uraian_ep) || cleanAiInput(item.rencana_perbaikan),
    preConditionMessage: 'Data tidak cukup untuk indikator',
    prompt: item => `PERAN: Anda adalah seorang perencana mutu. TUGAS: Buatkan satu poin indikator pencapaian yang spesifik, terukur, dan relevan. DATA: - Uraian Elemen Penilaian: "${cleanAiInput(item.uraian_ep)}" - Rencana Perbaikan: "${cleanAiInput(item.rencana_perbaikan)}". ATURAN: Jawaban harus berupa frasa indikator yang jelas.`
  });

  const handleGenerateSasaran = createAIGenerationHandler({
    field: 'sasaran',
    loadingSuffix: 'sasaran',
    preCondition: item => cleanAiInput(item.uraian_ep) || cleanAiInput(item.rencana_perbaikan),
    preConditionMessage: 'Data tidak cukup untuk sasaran',
    prompt: item => `PERAN: Anda adalah seorang manajer strategi. TUGAS: Buatkan satu poin sasaran yang jelas dan berorientasi hasil. DATA: - Uraian Elemen Penilaian: "${cleanAiInput(item.uraian_ep)}" - Rencana Perbaikan: "${cleanAiInput(item.rencana_perbaikan)}". ATURAN: Jawaban harus berupa kalimat sasaran yang ringkas.`
  });

  // --- Document Inventory and Grouping ---
  const prepareDocumentInventoryData = useCallback(() => {
    if (!groupedData) return [];
    const inventoryMap = new Map();
    Object.values(groupedData).forEach(bab => 
      Object.values(bab.standards).forEach(standard => 
        Object.values(standard.criterias).forEach(criteria => 
          criteria.items.forEach(item => {
            const docTitle = cleanAiInput(item.keterangan);
            if (docTitle) {
              if (!inventoryMap.has(docTitle)) {
                inventoryMap.set(docTitle, { kode_ep_list: new Set(), uraian_ep_list: new Set() });
              }
              inventoryMap.get(docTitle).kode_ep_list.add(item.kode_ep);
              inventoryMap.get(docTitle).uraian_ep_list
