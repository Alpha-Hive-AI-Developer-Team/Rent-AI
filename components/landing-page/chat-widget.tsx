"use client";

import { useState } from "react";
import Image from "next/image";
import { X, Zap} from "lucide-react";

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Button */}
     <button
  onClick={() => setIsOpen(true)}
  className="absolute bottom-6 right-6 flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white px-6 py-2 rounded-full shadow-lg transition-all duration-200 z-50 whitespace-nowrap"
>
  <Image
    src="/images/wp.png"
    alt="whatsapp"
    width={20}
    height={20}
  />
  <span className=" hidden sm:inline">Chat with Us</span>
</button>


      {/* Chat Dialog */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-[90%] sm:w-80  rounded-xl shadow-2xl overflow-hidden z-50  animate-fadeIn">
          {/* Header */}
          <div className="flex items-center justify-between bg-[#075E54] text-white px-4 py-3">
            <div className="flex items-center gap-3 text-left">
              {/* White background behind logo */}
              <div className="bg-white p-1.5 rounded-md flex items-center justify-center">
                <Image
                  src="/images/logo-white.png"
                  alt="Rent Ai"
                  width={24}
                  height={24}
                />
              </div>

              {/* Text Section */}
              <div className="flex flex-col leading-tight">
                <p className="font-semibold text-sm">Rent Ai</p>
                <p className="text-[11px] text-gray-200">
                  Typically replies within a day
                </p>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="text-black hover:text-gray-300 bg-white rounded-full p-1"
            >
              <X className="w-3 h-3" />
            </button>
          </div>

          {/* Chat Body */}
          <div className="bg-[#ECE5DD] p-4 h-48 overflow-y-auto text-xs text-left">
            <div className="bg-white rounded-md p-3 shadow-sm max-w-[60%]">
              <p className="font-semibold text-gray-900 mb-1">Rent Ai</p>
              <p className="text-gray-700">Hello there! </p>
              <p className="text-gray-700">How can I help you?</p>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-white border-t p-3 text-center">
            <button className="bg-[#25D366] hover:bg-[#1ebe5d] text-white w-full py-2 rounded-md font-medium mb-2">
              Start Chat
            </button>
           
            <p className="text-gray-600 text-xs">
              by{" "}
              <span className="font-semibold underline text-gray-800">
                Novochat
              </span>
            </p>
          </div>
        </div>
      )}
    </>
  );
}
