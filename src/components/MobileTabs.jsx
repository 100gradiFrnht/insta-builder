export default function MobileTabs({ activeTab, setActiveTab }) {
  return (
    <div className="lg:hidden flex border-b border-gray-200 bg-white sticky top-0 z-10">
      <button
        onClick={() => setActiveTab('image')}
        className={`flex-1 py-3 text-sm font-medium ${activeTab === 'image' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
      >
        Image
      </button>
      <button
        onClick={() => setActiveTab('overlays')}
        className={`flex-1 py-3 text-sm font-medium ${activeTab === 'overlays' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
      >
        Overlays
      </button>
      <button
        onClick={() => setActiveTab('text')}
        className={`flex-1 py-3 text-sm font-medium ${activeTab === 'text' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
      >
        Text
      </button>
    </div>
  );
}
