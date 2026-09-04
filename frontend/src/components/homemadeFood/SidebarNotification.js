import '../../animation.css'

const SidebarNotification = ({ isOpen, message, onClose }) => {
  return (
      <div className={`sidebar fixed top-20 right-0 w-64 bg-white shadow-md p-4 transition-transform transform ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <button onClick={onClose} className="absolute top-2 right-2 text-lg font-bold">&times;</button>
          <p>{message}</p>
      </div>
  );
};

export default SidebarNotification;
