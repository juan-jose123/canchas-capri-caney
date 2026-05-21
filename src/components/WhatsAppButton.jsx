import { MessageCircle } from 'lucide-react';
import { WHATSAPP_NUMBER } from '../utils/constants';

export default function WhatsAppButton() {
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=Hola!%20Quiero%20reservar%20una%20cancha`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center shadow-xl shadow-green-200 hover:scale-110 transition-all animate-bounce-soft"
      aria-label="Contactar por WhatsApp"
    >
      <MessageCircle size={28} className="text-white" fill="white" />
    </a>
  );
}
