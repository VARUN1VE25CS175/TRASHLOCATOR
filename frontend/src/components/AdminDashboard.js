import { useState, useEffect } from 'react';
import axios from 'axios';
import { Trash2, Plus, Edit2, Trash, LogOut, MapPin, X, Map as MapIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function AdminDashboard({ onLogout }) {
  const navigate = useNavigate();
  const [dustbins, setDustbins] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingDustbin, setEditingDustbin] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    latitude: '',
    longitude: '',
  });
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem('adminToken');

  // Fetch all dustbins
  const fetchDustbins = async () => {
    try {
      const response = await axios.get(`${API}/dustbins`);
      setDustbins(response.data);
    } catch (error) {
      console.error('Error fetching dustbins:', error);
      toast.error('Failed to load dustbins');
    }
  };

  useEffect(() => {
    fetchDustbins();
  }, []);

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Open modal for adding new dustbin
  const handleAddNew = () => {
    setEditingDustbin(null);
    setFormData({ name: '', description: '', latitude: '', longitude: '' });
    setShowModal(true);
  };

  // Open modal for editing dustbin
  const handleEdit = (dustbin) => {
    setEditingDustbin(dustbin);
    setFormData({
      name: dustbin.name,
      description: dustbin.description || '',
      latitude: dustbin.latitude.toString(),
      longitude: dustbin.longitude.toString(),
    });
    setShowModal(true);
  };

  // Handle form submit (add or update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        name: formData.name,
        description: formData.description,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
      };

      if (editingDustbin) {
        // Update existing dustbin
        await axios.put(
          `${API}/dustbins/${editingDustbin.id}`,
          data,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Dustbin updated successfully');
      } else {
        // Create new dustbin
        await axios.post(
          `${API}/dustbins`,
          data,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Dustbin added successfully');
      }

      setShowModal(false);
      fetchDustbins();
    } catch (error) {
      console.error('Error saving dustbin:', error);
      toast.error('Failed to save dustbin');
    } finally {
      setLoading(false);
    }
  };

  // Handle delete dustbin
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this dustbin?')) {
      return;
    }

    try {
      await axios.delete(
        `${API}/dustbins/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Dustbin deleted successfully');
      fetchDustbins();
    } catch (error) {
      console.error('Error deleting dustbin:', error);
      toast.error('Failed to delete dustbin');
    }
  };

  // Handle logout
  const handleLogout = () => {
    onLogout();
    navigate('/admin/login');
    toast.success('Logged out successfully');
  };

  // Get current location
  const handleUseCurrentLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude.toFixed(6),
            longitude: position.coords.longitude.toFixed(6),
          }));
          toast.success('Location updated');
        },
        (error) => {
          console.error('Error getting location:', error);
          toast.error('Failed to get location');
        }
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50" data-testid="admin-dashboard">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-[#4A7C59] rounded-xl p-2">
                <Trash2 size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-600">Manage dustbin locations</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/')}
                className="text-gray-600 hover:text-[#4A7C59] font-medium px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2"
                data-testid="view-map-button"
              >
                <MapPin size={18} />
                <span className="hidden sm:inline">View Map</span>
              </button>
              <button
                onClick={handleLogout}
                className="bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 rounded-full px-4 py-2 font-medium transition-all flex items-center gap-2"
                data-testid="logout-button"
              >
                <LogOut size={18} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Add Button */}
        <div className="mb-6">
          <button
            onClick={handleAddNew}
            className="bg-[#4A7C59] hover:bg-[#3A6346] text-white rounded-full px-6 py-3 font-medium shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
            data-testid="add-dustbin-button"
          >
            <Plus size={20} />
            Add New Dustbin
          </button>
        </div>

        {/* Dustbins Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dustbins.map((dustbin) => (
            <div
              key={dustbin.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-6"
              data-testid="dustbin-card"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg text-gray-900 truncate" data-testid="dustbin-card-name">
                    {dustbin.name}
                  </h3>
                  {dustbin.description && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {dustbin.description}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin size={16} className="text-[#4A7C59]" />
                  <span className="font-mono text-xs">
                    {dustbin.latitude.toFixed(6)}, {dustbin.longitude.toFixed(6)}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(dustbin)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg px-4 py-2 font-medium transition-colors flex items-center justify-center gap-2"
                  data-testid="edit-dustbin-button"
                >
                  <Edit2 size={16} />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(dustbin.id)}
                  className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg px-4 py-2 font-medium transition-colors flex items-center justify-center gap-2"
                  data-testid="delete-dustbin-button"
                >
                  <Trash size={16} />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {dustbins.length === 0 && (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-2xl mb-4">
              <Trash2 size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No dustbins yet</h3>
            <p className="text-gray-600 mb-4">Add your first dustbin to get started</p>
          </div>
        )}
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" data-testid="dustbin-modal">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingDustbin ? 'Edit Dustbin' : 'Add New Dustbin'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                data-testid="close-modal-button"
              >
                <X size={24} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., Park Dustbin"
                  className="w-full bg-gray-50 border-transparent focus:bg-white focus:border-[#4A7C59] focus:ring-2 focus:ring-[#4A7C59]/20 rounded-xl px-4 py-3 transition-all outline-none"
                  data-testid="dustbin-name-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="e.g., Near the main entrance"
                  rows={3}
                  className="w-full bg-gray-50 border-transparent focus:bg-white focus:border-[#4A7C59] focus:ring-2 focus:ring-[#4A7C59]/20 rounded-xl px-4 py-3 transition-all outline-none resize-none"
                  data-testid="dustbin-description-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Latitude *
                  </label>
                  <input
                    type="number"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleInputChange}
                    required
                    step="any"
                    placeholder="28.6139"
                    className="w-full bg-gray-50 border-transparent focus:bg-white focus:border-[#4A7C59] focus:ring-2 focus:ring-[#4A7C59]/20 rounded-xl px-4 py-3 transition-all outline-none"
                    data-testid="dustbin-latitude-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Longitude *
                  </label>
                  <input
                    type="number"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleInputChange}
                    required
                    step="any"
                    placeholder="77.2090"
                    className="w-full bg-gray-50 border-transparent focus:bg-white focus:border-[#4A7C59] focus:ring-2 focus:ring-[#4A7C59]/20 rounded-xl px-4 py-3 transition-all outline-none"
                    data-testid="dustbin-longitude-input"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleUseCurrentLocation}
                className="w-full text-[#4A7C59] hover:bg-[#4A7C59]/10 rounded-lg px-4 py-2 font-medium transition-all text-sm"
                data-testid="use-current-location-button"
              >
                Use Current Location
              </button>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full px-6 py-3 font-medium transition-all"
                  data-testid="cancel-button"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-[#4A7C59] hover:bg-[#3A6346] text-white rounded-full px-6 py-3 font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                  data-testid="save-dustbin-button"
                >
                  {loading ? 'Saving...' : editingDustbin ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;