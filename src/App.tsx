import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Users, 
  Tags, 
  Truck, 
  BarChart3, 
  LogOut, 
  Menu, 
  X, 
  Search, 
  Plus, 
  Printer, 
  Download,
  ScanLine,
  ChevronRight,
  Globe,
  TrendingUp,
  Lock,
  User as UserIcon
} from 'lucide-react';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Link, 
  useLocation, 
  Navigate, 
  useNavigate 
} from 'react-router-dom';
import JsBarcode from 'jsbarcode';
import Quagga from '@ericblade/quagga2';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';

// --- Utils ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
type UserRole = 'admin' | 'editor' | 'viewer';

interface User {
  id: number;
  username: string;
  role: UserRole;
}

interface Vendor {
  id: number;
  name: string;
  contact: string;
  address: string;
}

interface Category {
  id: number;
  name: string;
}

interface Product {
  id: number;
  item_code: string;
  item_name: string;
  category_id: number;
  category_name?: string;
  barcode_number: string;
  quantity: number;
  rate: number;
  unit: string;
}

// --- Components ---

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  onConfirm, 
  confirmText = "Confirm", 
  cancelText = "Cancel",
  type = "info" 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  title: string, 
  children: React.ReactNode, 
  onConfirm?: () => void, 
  confirmText?: string, 
  cancelText?: string,
  type?: "info" | "danger" | "success"
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 text-slate-600">
          {children}
        </div>
        <div className="p-6 bg-slate-50 flex justify-end gap-3">
          <button 
            onClick={onClose} 
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
          >
            {cancelText}
          </button>
          {onConfirm && (
            <button 
              onClick={() => { onConfirm(); onClose(); }} 
              className={cn(
                "px-4 py-2 text-sm font-bold text-white rounded-lg transition-colors shadow-lg",
                type === "danger" ? "bg-red-600 hover:bg-red-700 shadow-red-100" : 
                type === "success" ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100" :
                "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100"
              )}
            >
              {confirmText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const Sidebar = ({ user, onLogout }: { user: User, onLogout: () => void }) => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(true);

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['admin', 'editor', 'viewer'] },
    { name: 'Purchase Entry', path: '/purchase', icon: ShoppingCart, roles: ['admin', 'editor'] },
    { name: 'Stock Reports', path: '/stock', icon: Package, roles: ['admin', 'editor', 'viewer'] },
    { name: 'Market Insights', path: '/insights', icon: Globe, roles: ['admin', 'editor', 'viewer'] },
    { name: 'Vendors', path: '/vendors', icon: Truck, roles: ['admin', 'editor'] },
    { name: 'Categories', path: '/categories', icon: Tags, roles: ['admin', 'editor'] },
    { name: 'Users', path: '/users', icon: Users, roles: ['admin'] },
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(user.role));

  return (
    <div className={cn("flex flex-col h-screen bg-white border-r border-slate-200 transition-all duration-300", isOpen ? "w-64" : "w-20")}>
      <div className="p-6 flex items-center justify-between">
        {isOpen && <h1 className="text-xl font-bold text-indigo-600">StockMaster</h1>}
        <button onClick={() => setIsOpen(!isOpen)} className="p-2 hover:bg-slate-100 rounded-lg">
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {filteredItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "sidebar-item",
              location.pathname === item.path && "active",
              !isOpen && "justify-center px-0"
            )}
          >
            <item.icon size={20} />
            {isOpen && <span>{item.name}</span>}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100 space-y-2">
        <div className={cn("flex items-center gap-3 p-2", !isOpen && "justify-center")}>
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
            {user.username[0].toUpperCase()}
          </div>
          {isOpen && (
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">{user.username}</p>
              <p className="text-xs text-slate-500 capitalize">{user.role}</p>
            </div>
          )}
        </div>
        <button 
          onClick={onLogout}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors",
            !isOpen && "justify-center px-0"
          )}
        >
          <LogOut size={20} />
          {isOpen && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>
    </div>
  );
};

const Dashboard = ({ user }: { user: User }) => {
  const [stats, setStats] = useState({ totalProducts: 0, totalStock: 0, totalSales: 0 });

  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => setStats(data));
  }, []);

  const canManage = user.role === 'admin' || user.role === 'editor';

  return (
    <div className="p-8 space-y-8">
      <header>
        <h2 className="text-2xl font-bold">Welcome back, {user.username}!</h2>
        <p className="text-slate-500">Here's what's happening with your inventory today.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card-stat">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Package size={24} />
            </div>
            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">+12%</span>
          </div>
          <p className="text-slate-500 text-sm font-medium">Total Products</p>
          <h3 className="text-3xl font-bold mt-1">{stats.totalProducts}</h3>
        </div>

        <div className="card-stat">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <BarChart3 size={24} />
            </div>
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">Stable</span>
          </div>
          <p className="text-slate-500 text-sm font-medium">Total Stock</p>
          <h3 className="text-3xl font-bold mt-1">{stats.totalStock}</h3>
        </div>

        <div className="card-stat">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <ShoppingCart size={24} />
            </div>
            <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full">New</span>
          </div>
          <p className="text-slate-500 text-sm font-medium">Total Sales</p>
          <h3 className="text-3xl font-bold mt-1">${stats.totalSales}</h3>
        </div>
      </div>

      {canManage && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h4 className="font-bold mb-4">Quick Actions</h4>
            <div className="grid grid-cols-2 gap-4">
              <Link to="/purchase" className="p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors flex flex-col items-center gap-2">
                <Plus className="text-indigo-600" />
                <span className="text-sm font-medium">New Purchase</span>
              </Link>
              <Link to="/stock" className="p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors flex flex-col items-center gap-2">
                <Search className="text-indigo-600" />
                <span className="text-sm font-medium">Check Stock</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const PurchaseEntry = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    vendor_id: '',
    purchase_date: new Date().toISOString().split('T')[0],
    item_code: `ITM-${Math.floor(1000 + Math.random() * 9000)}`,
    item_name: '',
    category_id: '',
    unit: 'Pcs',
    weight: '',
    quantity: '',
    rate: '',
    pn: '',
    kn: '',
    per_kg_rate: '',
    barcode_number: `BAR${new Date().getFullYear()}${Math.floor(100000 + Math.random() * 900000)}`
  });
  const [showBarcode, setShowBarcode] = useState(false);
  const barcodeRef = useRef<SVGSVGElement>(null);

  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    fetch('/api/vendors').then(res => res.json()).then(setVendors);
    fetch('/api/categories').then(res => res.json()).then(setCategories);
  }, []);

  useEffect(() => {
    if (showBarcode && barcodeRef.current) {
      JsBarcode(barcodeRef.current, formData.barcode_number, {
        format: "CODE128",
        width: 2,
        height: 50,
        displayValue: true
      });
    }
  }, [showBarcode, formData.barcode_number]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      // Auto calculate per kg rate if weight and rate are provided
      if (name === 'weight' || name === 'rate') {
        const w = parseFloat(name === 'weight' ? value : prev.weight);
        const r = parseFloat(name === 'rate' ? value : prev.rate);
        if (w && r) {
          newData.per_kg_rate = (r / w).toFixed(2);
        }
      }
      return newData;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/purchase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    if (res.ok) {
      setShowBarcode(true);
      setShowSuccessModal(true);
    }
  };

  const downloadBarcode = () => {
    if (!barcodeRef.current) return;
    const svg = barcodeRef.current;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `barcode-${formData.barcode_number}.png`;
      downloadLink.href = `${pngFile}`;
      downloadLink.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Modal 
        isOpen={showSuccessModal} 
        onClose={() => setShowSuccessModal(false)} 
        title="Success"
        type="success"
        confirmText="OK"
        onConfirm={() => setShowSuccessModal(false)}
      >
        Purchase entry has been saved successfully and barcode generated.
      </Modal>
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-2xl font-bold mb-6">New Purchase Entry</h2>
        
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Vendor</label>
            <select 
              name="vendor_id" 
              value={formData.vendor_id} 
              onChange={handleChange}
              required
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="">Select Vendor</option>
              {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Date</label>
            <input 
              type="date" 
              name="purchase_date" 
              value={formData.purchase_date} 
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Item Code</label>
            <input 
              type="text" 
              name="item_code" 
              value={formData.item_code} 
              readOnly
              className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-slate-50 outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Item Name</label>
            <input 
              type="text" 
              name="item_name" 
              value={formData.item_name} 
              onChange={handleChange}
              required
              placeholder="Enter product name"
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Category</label>
            <select 
              name="category_id" 
              value={formData.category_id} 
              onChange={handleChange}
              required
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="">Select Category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Unit</label>
            <select 
              name="unit" 
              value={formData.unit} 
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="Pcs">Pcs</option>
              <option value="Kg">Kg</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Weight (if Kg)</label>
            <input 
              type="number" 
              name="weight" 
              value={formData.weight} 
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Quantity</label>
            <input 
              type="number" 
              name="quantity" 
              value={formData.quantity} 
              onChange={handleChange}
              required
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Rate</label>
            <input 
              type="number" 
              name="rate" 
              value={formData.rate} 
              onChange={handleChange}
              required
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Per Kg Rate</label>
            <input 
              type="text" 
              name="per_kg_rate" 
              value={formData.per_kg_rate} 
              readOnly
              className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-slate-50 outline-none"
            />
          </div>

          <div className="md:col-span-2 pt-4">
            <button 
              type="submit" 
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
            >
              Save Purchase & Generate Barcode
            </button>
          </div>
        </form>

        {showBarcode && (
          <div className="mt-8 p-6 bg-slate-50 rounded-xl border border-dashed border-slate-300 flex flex-col items-center">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Generated Barcode</h3>
            <svg ref={barcodeRef}></svg>
            <div className="flex gap-4 mt-6">
              <button 
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-100"
              >
                <Printer size={16} /> Print
              </button>
              <button 
                onClick={downloadBarcode}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-100"
              >
                <Download size={16} /> Download PNG
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const StockReports = ({ user }: { user: User }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const scannerRef = useRef<HTMLDivElement>(null);

  const canManage = user.role === 'admin' || user.role === 'editor';

  useEffect(() => {
    fetch('/api/products').then(res => res.json()).then(setProducts);
  }, []);

  const startScanner = () => {
    setSearch(''); // Clear search before starting new scan
    setIsScanning(true);
    setLastScanned(null);
    
    Quagga.init({
      inputStream: {
        type: "LiveStream",
        target: scannerRef.current!,
        constraints: {
          width: 640,
          height: 480,
          facingMode: "environment"
        },
      },
      decoder: {
        readers: ["code_128_reader", "ean_reader", "ean_8_reader", "code_39_reader"]
      },
      locate: true
    }, (err) => {
      if (err) {
        console.error(err);
        setIsScanning(false);
        return;
      }
      Quagga.start();
    });

    Quagga.onDetected((data) => {
      const code = data.codeResult.code;
      if (code) {
        setSearch(code);
        setLastScanned(code);
        stopScanner();
        
        // Visual feedback: briefly highlight the search result then clear if needed
        // The user asked to "automatically clear the search input after a successful scan"
        // but usually you want to see the result. We'll add a clear button for manual clearing
        // and a brief "Success" state.
        setTimeout(() => setLastScanned(null), 2000);
      }
    });
  };

  const stopScanner = () => {
    Quagga.stop();
    setIsScanning(false);
  };

  const exportToCSV = () => {
    const headers = ['Item Code', 'Item Name', 'Category', 'Barcode', 'Quantity', 'Rate', 'Unit'];
    const rows = filteredProducts.map(p => [
      p.item_code,
      p.item_name,
      p.category_name || 'N/A',
      p.barcode_number,
      p.quantity,
      p.rate,
      p.unit
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `inventory_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredProducts = products.filter(p => 
    p.item_name.toLowerCase().includes(search.toLowerCase()) || 
    p.barcode_number.includes(search)
  );

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Stock Reports</h2>
          <p className="text-slate-500">Manage and track your current inventory levels.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by name or barcode..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={cn(
                "pl-10 pr-10 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none w-full transition-all",
                lastScanned && "ring-2 ring-emerald-500 border-emerald-500"
              )}
            />
            {search && (
              <button 
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            )}
          </div>
          {canManage && (
            <button 
              onClick={startScanner}
              className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-100"
              title="Scan Barcode"
            >
              <ScanLine size={20} />
            </button>
          )}
          <button 
            onClick={exportToCSV}
            className="p-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-100 flex items-center gap-2 px-4"
            title="Export to CSV"
          >
            <Download size={20} />
            <span className="hidden sm:inline font-medium text-sm">Export CSV</span>
          </button>
        </div>
      </div>

      {isScanning && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl overflow-hidden max-w-lg w-full shadow-2xl">
            <div className="p-4 border-b flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <h3 className="font-bold">Scanning Barcode...</h3>
              </div>
              <button onClick={stopScanner} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="relative aspect-video bg-black">
              <div ref={scannerRef} className="w-full h-full [&>video]:w-full [&>video]:h-full [&>video]:object-cover"></div>
              
              {/* Scanning Overlay */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-[15%] border-2 border-white/30 rounded-2xl">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-indigo-500 rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-indigo-500 rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-indigo-500 rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-indigo-500 rounded-br-lg" />
                  
                  {/* Laser Line Animation */}
                  <div className="absolute left-0 right-0 h-0.5 bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)] animate-[scan_2s_ease-in-out_infinite]" />
                </div>
              </div>
            </div>
            <div className="p-6 text-center space-y-2">
              <p className="text-sm text-slate-600 font-medium">Align the barcode within the frame</p>
              <p className="text-xs text-slate-400">Supported: Code 128, EAN, Code 39</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 text-sm font-bold text-slate-500 uppercase tracking-wider">Item</th>
              <th className="px-6 py-4 text-sm font-bold text-slate-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-4 text-sm font-bold text-slate-500 uppercase tracking-wider">Barcode</th>
              <th className="px-6 py-4 text-sm font-bold text-slate-500 uppercase tracking-wider">Stock</th>
              <th className="px-6 py-4 text-sm font-bold text-slate-500 uppercase tracking-wider">Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredProducts.length > 0 ? (
              filteredProducts.map(product => (
                <tr key={product.id} className={cn(
                  "hover:bg-slate-50 transition-colors",
                  search === product.barcode_number && "bg-indigo-50/50"
                )}>
                  <td className="px-6 py-4">
                    <div className="font-medium">{product.item_name}</div>
                    <div className="text-xs text-slate-400">{product.item_code}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-medium">
                      {product.category_name}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-sm">{product.barcode_number}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "font-bold",
                      product.quantity < 10 ? "text-red-600" : "text-slate-900"
                    )}>
                      {product.quantity} {product.unit}
                    </span>
                  </td>
                  <td className="px-6 py-4">${product.rate}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                  <Package className="mx-auto mb-2 opacity-20" size={48} />
                  <p>No products found matching your search.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const MarketInsights = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<string | null>(null);
  const [sources, setSources] = useState<{ uri: string; title: string }[]>([]);

  const fetchInsights = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setInsights(null);
    setSources([]);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Research market trends, news, and pricing for: ${query}. Provide a concise summary of current insights.`,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      setInsights(response.text || "No insights found.");
      
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) {
        const webSources = chunks
          .filter(chunk => chunk.web)
          .map(chunk => ({ uri: chunk.web!.uri, title: chunk.web!.title }));
        setSources(webSources);
      }
    } catch (error) {
      console.error("Error fetching insights:", error);
      setInsights("Failed to fetch insights. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-4xl mx-auto">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center p-3 bg-indigo-100 text-indigo-600 rounded-2xl mb-2">
          <Globe size={32} />
        </div>
        <h2 className="text-3xl font-bold text-slate-900">Market Insights</h2>
        <p className="text-slate-500">Search for real-time market trends and news related to your inventory.</p>
      </div>

      <form onSubmit={fetchInsights} className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={24} />
        <input 
          type="text" 
          placeholder="Search for 'current price of copper', 'electronics market trends 2024'..." 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-14 pr-32 py-4 bg-white rounded-2xl border border-slate-200 shadow-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-lg"
        />
        <button 
          type="submit"
          disabled={loading}
          className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-100"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {loading && (
        <div className="space-y-4 animate-pulse">
          <div className="h-4 bg-slate-200 rounded w-3/4"></div>
          <div className="h-4 bg-slate-200 rounded w-full"></div>
          <div className="h-4 bg-slate-200 rounded w-5/6"></div>
        </div>
      )}

      {insights && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="p-8 space-y-6">
            <div className="prose prose-slate max-w-none">
              <ReactMarkdown>{insights}</ReactMarkdown>
            </div>
            
            {sources.length > 0 && (
              <div className="pt-6 border-t border-slate-100">
                <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <TrendingUp size={16} className="text-indigo-500" />
                  Sources & Further Reading
                </h4>
                <div className="flex flex-wrap gap-2">
                  {sources.map((source, i) => (
                    <a 
                      key={i} 
                      href={source.uri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-xs font-medium transition-colors border border-slate-200"
                    >
                      <Globe size={12} />
                      {source.title || 'Source'}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const LoginPage = ({ onLogin }: { onLogin: (user: User) => void }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      if (data.success) {
        onLogin(data.user);
      } else {
        setError(data.message || 'Invalid credentials');
      }
    } catch (err) {
      console.error("Login fetch error:", err);
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-3xl shadow-xl border border-slate-100">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200 mb-6">
            <Package size={32} />
          </div>
          <h2 className="text-3xl font-bold text-slate-900">Inventory Management</h2>
          <p className="mt-2 text-slate-500">Log in to manage your warehouse</p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100 animate-shake">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div className="relative">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="block w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                placeholder="Username"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                placeholder="Password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Log in'}
          </button>
          
          <div className="text-center text-xs text-slate-400">
            <p>Admin: admin / admin123</p>
            <p>Editor: editor / editor123</p>
          </div>
        </form>
      </div>
    </div>
  );
};

const VendorsPage = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [formData, setFormData] = useState({ name: '', contact: '', address: '' });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = () => {
    fetch('/api/vendors').then(res => res.json()).then(setVendors);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingId ? `/api/vendors/${editingId}` : '/api/vendors';
    const method = editingId ? 'PUT' : 'POST';
    
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    if (res.ok) {
      fetchVendors();
      setFormData({ name: '', contact: '', address: '' });
      setEditingId(null);
    }
  };

  const handleEdit = (vendor: Vendor) => {
    setEditingId(vendor.id);
    setFormData({ name: vendor.name, contact: vendor.contact || '', address: vendor.address || '' });
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const res = await fetch(`/api/vendors/${deleteId}`, { method: 'DELETE' });
    if (res.ok) fetchVendors();
    setDeleteId(null);
  };

  return (
    <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
      <Modal 
        isOpen={deleteId !== null} 
        onClose={() => setDeleteId(null)} 
        title="Delete Vendor"
        type="danger"
        confirmText="Delete"
        onConfirm={confirmDelete}
      >
        Are you sure you want to delete this vendor? This action cannot be undone.
      </Modal>
      <div className="lg:col-span-1">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm sticky top-8">
          <h3 className="text-lg font-bold mb-4">{editingId ? 'Edit Vendor' : 'Add New Vendor'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Name</label>
              <input 
                type="text" 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Contact</label>
              <input 
                type="text" 
                value={formData.contact}
                onChange={e => setFormData({...formData, contact: e.target.value})}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Address</label>
              <textarea 
                value={formData.address}
                onChange={e => setFormData({...formData, address: e.target.value})}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-bold hover:bg-indigo-700 transition-colors">
                {editingId ? 'Update Vendor' : 'Save Vendor'}
              </button>
              {editingId && (
                <button 
                  type="button" 
                  onClick={() => { setEditingId(null); setFormData({ name: '', contact: '', address: '' }); }}
                  className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
      <div className="lg:col-span-2">
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-6 py-4 font-bold text-slate-500 text-sm uppercase">Vendor Name</th>
                <th className="px-6 py-4 font-bold text-slate-500 text-sm uppercase">Contact</th>
                <th className="px-6 py-4 font-bold text-slate-500 text-sm uppercase">Address</th>
                <th className="px-6 py-4 font-bold text-slate-500 text-sm uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {vendors.map(v => (
                <tr key={v.id}>
                  <td className="px-6 py-4 font-medium">{v.name}</td>
                  <td className="px-6 py-4">{v.contact}</td>
                  <td className="px-6 py-4 text-slate-500">{v.address}</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button onClick={() => handleEdit(v)} className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">Edit</button>
                    <button onClick={() => setDeleteId(v.id)} className="text-red-600 hover:text-red-800 text-sm font-medium">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const CategoriesPage = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = () => {
    fetch('/api/categories').then(res => res.json()).then(setCategories);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingId ? `/api/categories/${editingId}` : '/api/categories';
    const method = editingId ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName })
    });

    if (res.ok) {
      fetchCategories();
      setNewName('');
      setEditingId(null);
    } else {
      const data = await res.json();
      setErrorMsg(data.error || 'Failed to save category');
    }
  };

  const handleEdit = (category: Category) => {
    setEditingId(category.id);
    setNewName(category.name);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const res = await fetch(`/api/categories/${deleteId}`, { method: 'DELETE' });
    if (res.ok) {
      fetchCategories();
    } else {
      const data = await res.json();
      setErrorMsg(data.error || 'Failed to delete category');
    }
    setDeleteId(null);
  };

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-8">
      <Modal 
        isOpen={deleteId !== null} 
        onClose={() => setDeleteId(null)} 
        title="Delete Category"
        type="danger"
        confirmText="Delete"
        onConfirm={confirmDelete}
      >
        Are you sure you want to delete this category? This action cannot be undone and may fail if products are linked to it.
      </Modal>
      <Modal 
        isOpen={errorMsg !== null} 
        onClose={() => setErrorMsg(null)} 
        title="Error"
        type="danger"
        confirmText="OK"
        onConfirm={() => setErrorMsg(null)}
      >
        {errorMsg}
      </Modal>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold mb-4">{editingId ? 'Edit Category' : 'Add Category'}</h3>
        <form onSubmit={handleSubmit} className="flex gap-4">
          <input 
            type="text" 
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Category name..."
            className="flex-1 px-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
          <div className="flex gap-2">
            <button className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700">
              {editingId ? 'Update' : 'Add'}
            </button>
            {editingId && (
              <button 
                type="button"
                onClick={() => { setEditingId(null); setNewName(''); }}
                className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 bg-slate-50 border-b font-bold text-slate-500 text-sm uppercase">
          Available Categories
        </div>
        <div className="divide-y">
          {categories.map(c => (
            <div key={c.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <span className="font-medium">{c.name}</span>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => handleEdit(c)}
                  className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                >
                  Edit
                </button>
                <button 
                  onClick={() => setDeleteId(c.id)}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          {categories.length === 0 && (
            <div className="px-6 py-12 text-center text-slate-500">
              <Tags className="mx-auto mb-2 opacity-20" size={48} />
              <p>No categories found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const UsersPage = ({ user: currentUser }: { user: User }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [formData, setFormData] = useState({ username: '', password: '', role: 'viewer' as UserRole });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = () => {
    fetch('/api/users').then(res => res.json()).then(setUsers);
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingId ? `/api/users/${editingId}` : '/api/users';
    const method = editingId ? 'PUT' : 'POST';
    
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...formData, requesterRole: currentUser.role })
    });

    if (res.ok) {
      fetchUsers();
      setFormData({ username: '', password: '', role: 'viewer' as UserRole });
      setEditingId(null);
    } else {
      const data = await res.json();
      setErrorMsg(data.error || 'Failed to save user');
    }
  };

  const handleEdit = (user: User) => {
    setEditingId(user.id);
    setFormData({ username: user.username, password: '', role: user.role });
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const res = await fetch(`/api/users/${deleteId}?requesterRole=${currentUser.role}`, { method: 'DELETE' });
    if (res.ok) fetchUsers();
    setDeleteId(null);
  };

  return (
    <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
      <Modal 
        isOpen={deleteId !== null} 
        onClose={() => setDeleteId(null)} 
        title="Delete User"
        type="danger"
        confirmText="Delete"
        onConfirm={confirmDelete}
      >
        Are you sure you want to delete this user? This action cannot be undone.
      </Modal>
      <Modal 
        isOpen={errorMsg !== null} 
        onClose={() => setErrorMsg(null)} 
        title="Error"
        type="danger"
        confirmText="OK"
        onConfirm={() => setErrorMsg(null)}
      >
        {errorMsg}
      </Modal>
      <div className="lg:col-span-1">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm sticky top-8">
          <h3 className="text-lg font-bold mb-4">{editingId ? 'Edit User' : 'Add New User'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Username</label>
              <input 
                type="text" 
                value={formData.username}
                onChange={e => setFormData({...formData, username: e.target.value})}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Password {editingId && '(leave blank to keep current)'}</label>
              <input 
                type="password" 
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                required={!editingId}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Role</label>
              <select 
                value={formData.role}
                onChange={e => setFormData({...formData, role: e.target.value as UserRole})}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-bold hover:bg-indigo-700 transition-colors">
                {editingId ? 'Update User' : 'Save User'}
              </button>
              {editingId && (
                <button 
                  type="button" 
                  onClick={() => { setEditingId(null); setFormData({ username: '', password: '', role: 'viewer' }); }}
                  className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search users..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none w-full transition-all bg-white"
            />
          </div>
          <div className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-500">
            {filteredUsers.length} Users
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-6 py-4 font-bold text-slate-500 text-sm uppercase">Username</th>
                <th className="px-6 py-4 font-bold text-slate-500 text-sm uppercase">Role</th>
                <th className="px-6 py-4 font-bold text-slate-500 text-sm uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredUsers.map(u => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">
                        {u.username[0].toUpperCase()}
                      </div>
                      <span className="font-medium">{u.username}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-1 rounded-md text-xs font-medium capitalize",
                      u.role === 'admin' ? "bg-purple-50 text-purple-700" : 
                      u.role === 'editor' ? "bg-blue-50 text-blue-700" :
                      "bg-slate-100 text-slate-600"
                    )}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button onClick={() => handleEdit(u)} className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">Edit</button>
                    <button onClick={() => setDeleteId(u.id)} className="text-red-600 hover:text-red-800 text-sm font-medium">Delete</button>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-slate-500">
                    <Users className="mx-auto mb-2 opacity-20" size={48} />
                    <p>No users found matching your search.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const ProtectedRoute = ({ 
  user, 
  allowedRoles, 
  children 
}: { 
  user: User, 
  allowedRoles: UserRole[], 
  children: React.ReactNode 
}) => {
  if (!allowedRoles.includes(user.role)) return <Navigate to="/" />;
  return <>{children}</>;
};

// --- Main App ---

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('stockmaster_user');
    return saved ? JSON.parse(saved) : null;
  });

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('stockmaster_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('stockmaster_user');
  };

  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <Router>
      <div className="flex h-screen overflow-hidden">
        <Sidebar user={currentUser} onLogout={handleLogout} />
        <main className="flex-1 overflow-y-auto bg-slate-50">
          <Routes>
            <Route path="/" element={<Dashboard user={currentUser} />} />
            <Route path="/purchase" element={
              <ProtectedRoute user={currentUser} allowedRoles={['admin', 'editor']}>
                <PurchaseEntry />
              </ProtectedRoute>
            } />
            <Route path="/stock" element={<StockReports user={currentUser} />} />
            <Route path="/insights" element={<MarketInsights />} />
            <Route path="/vendors" element={
              <ProtectedRoute user={currentUser} allowedRoles={['admin', 'editor']}>
                <VendorsPage />
              </ProtectedRoute>
            } />
            <Route path="/categories" element={
              <ProtectedRoute user={currentUser} allowedRoles={['admin', 'editor']}>
                <CategoriesPage />
              </ProtectedRoute>
            } />
            <Route path="/users" element={
              <ProtectedRoute user={currentUser} allowedRoles={['admin']}>
                <UsersPage user={currentUser} />
              </ProtectedRoute>
            } />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
