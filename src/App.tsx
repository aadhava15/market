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
  ChevronRight
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

// --- Utils ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
interface User {
  id: number;
  username: string;
  role: string;
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

const Sidebar = ({ user, onLogout }: { user: User; onLogout: () => void }) => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(true);

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Purchase Entry', path: '/purchase', icon: ShoppingCart },
    { name: 'Stock Reports', path: '/stock', icon: Package },
    { name: 'Vendors', path: '/vendors', icon: Truck },
    { name: 'Categories', path: '/categories', icon: Tags },
    { name: 'Users', path: '/users', icon: Users },
  ];

  return (
    <div className={cn("flex flex-col h-screen bg-white border-r border-slate-200 transition-all duration-300", isOpen ? "w-64" : "w-20")}>
      <div className="p-6 flex items-center justify-between">
        {isOpen && <h1 className="text-xl font-bold text-indigo-600">StockMaster</h1>}
        <button onClick={() => setIsOpen(!isOpen)} className="p-2 hover:bg-slate-100 rounded-lg">
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {menuItems.map((item) => (
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

      <div className="p-4 border-t border-slate-100">
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
          className={cn("w-full mt-2 flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors", !isOpen && "justify-center px-0")}
        >
          <LogOut size={20} />
          {isOpen && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [stats, setStats] = useState({ totalProducts: 0, totalStock: 0, totalSales: 0 });

  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => setStats(data));
  }, []);

  return (
    <div className="p-8 space-y-8">
      <header>
        <h2 className="text-2xl font-bold">Welcome back!</h2>
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
      alert('Purchase saved successfully!');
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

const StockReports = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/products').then(res => res.json()).then(setProducts);
  }, []);

  const startScanner = () => {
    setIsScanning(true);
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
      }
    }, (err) => {
      if (err) {
        console.error(err);
        return;
      }
      Quagga.start();
    });

    Quagga.onDetected((data) => {
      setSearch(data.codeResult.code || '');
      stopScanner();
    });
  };

  const stopScanner = () => {
    Quagga.stop();
    setIsScanning(false);
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
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by name or barcode..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none w-full md:w-64"
            />
          </div>
          <button 
            onClick={startScanner}
            className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors"
            title="Scan Barcode"
          >
            <ScanLine size={20} />
          </button>
        </div>
      </div>

      {isScanning && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl overflow-hidden max-w-lg w-full">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-bold">Scan Barcode</h3>
              <button onClick={stopScanner}><X /></button>
            </div>
            <div ref={scannerRef} className="aspect-video bg-black"></div>
            <div className="p-4 text-center text-sm text-slate-500">
              Point your camera at the barcode
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-bottom border-slate-200">
              <th className="px-6 py-4 text-sm font-bold text-slate-500 uppercase tracking-wider">Item</th>
              <th className="px-6 py-4 text-sm font-bold text-slate-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-4 text-sm font-bold text-slate-500 uppercase tracking-wider">Barcode</th>
              <th className="px-6 py-4 text-sm font-bold text-slate-500 uppercase tracking-wider">Stock</th>
              <th className="px-6 py-4 text-sm font-bold text-slate-500 uppercase tracking-wider">Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredProducts.map(product => (
              <tr key={product.id} className="hover:bg-slate-50 transition-colors">
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const VendorsPage = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [newVendor, setNewVendor] = useState({ name: '', contact: '', address: '' });

  useEffect(() => {
    fetch('/api/vendors').then(res => res.json()).then(setVendors);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/vendors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newVendor)
    });
    if (res.ok) {
      const data = await res.json();
      setVendors([...vendors, { ...newVendor, id: data.id }]);
      setNewVendor({ name: '', contact: '', address: '' });
    }
  };

  return (
    <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm sticky top-8">
          <h3 className="text-lg font-bold mb-4">Add New Vendor</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Name</label>
              <input 
                type="text" 
                value={newVendor.name}
                onChange={e => setNewVendor({...newVendor, name: e.target.value})}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Contact</label>
              <input 
                type="text" 
                value={newVendor.contact}
                onChange={e => setNewVendor({...newVendor, contact: e.target.value})}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Address</label>
              <textarea 
                value={newVendor.address}
                onChange={e => setNewVendor({...newVendor, address: e.target.value})}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button className="w-full bg-indigo-600 text-white py-2 rounded-lg font-bold hover:bg-indigo-700 transition-colors">
              Save Vendor
            </button>
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
              </tr>
            </thead>
            <tbody className="divide-y">
              {vendors.map(v => (
                <tr key={v.id}>
                  <td className="px-6 py-4 font-medium">{v.name}</td>
                  <td className="px-6 py-4">{v.contact}</td>
                  <td className="px-6 py-4 text-slate-500">{v.address}</td>
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

  useEffect(() => {
    fetch('/api/categories').then(res => res.json()).then(setCategories);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName })
    });
    if (res.ok) {
      const data = await res.json();
      setCategories([...categories, { id: data.id, name: newName }]);
      setNewName('');
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-8">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold mb-4">Add Category</h3>
        <form onSubmit={handleSubmit} className="flex gap-4">
          <input 
            type="text" 
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Category name..."
            className="flex-1 px-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
          <button className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700">
            Add
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 bg-slate-50 border-b font-bold text-slate-500 text-sm uppercase">
          Available Categories
        </div>
        <div className="divide-y">
          {categories.map(c => (
            <div key={c.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50">
              <span className="font-medium">{c.name}</span>
              <ChevronRight size={16} className="text-slate-300" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const LoginPage = ({ onLogin }: { onLogin: (user: User) => void }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (res.ok) {
      const data = await res.json();
      onLogin(data.user);
    } else {
      setError('Invalid username or password');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl shadow-slate-200 border border-slate-100">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200">
            <Package className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">StockMaster Pro</h1>
          <p className="text-slate-500">Sign in to manage your inventory</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{error}</div>}
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Username</label>
            <input 
              type="text" 
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              placeholder="admin"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          <button className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
            Sign In
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-400">
          <p>Default credentials: admin / admin123</p>
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <Router>
      <div className="flex h-screen overflow-hidden">
        <Sidebar user={user} onLogout={handleLogout} />
        <main className="flex-1 overflow-y-auto bg-slate-50">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/purchase" element={<PurchaseEntry />} />
            <Route path="/stock" element={<StockReports />} />
            <Route path="/vendors" element={<VendorsPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/users" element={<div className="p-8"><h2 className="text-2xl font-bold">User Management</h2><p className="text-slate-500">Feature coming soon.</p></div>} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
