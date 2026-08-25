'use client';

import Link from 'next/link';
import { FaPhone, FaMapMarkerAlt, FaWhatsapp, FaInstagram } from 'react-icons/fa';
import { FaTiktok } from 'react-icons/fa6';

export function Footer() {
  return (
    <footer className="bg-maroon text-white mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-mustard rounded-full flex items-center justify-center font-bold text-maroon">
                E
              </div>
              <span className="text-lg font-bold">Elfijr Kitchen</span>
            </div>
            <p className="text-white/70 text-sm">
            Delicious jollof ! Tantalising fried rice ! Best swallow 😋 The most appetising shawarma and burger 🍔 😋 in kaduna ! We welcome you with a big hug 🫂 to Elfijr Our kaduna people and guests"
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm text-white/70">
              <li>
                <Link href="/" className="hover:text-white transition">
                  Browse Kitchens
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-sm text-white/70">
              <li>
                <Link href="/faq" className="hover:text-white transition">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white transition">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-4 text-sm text-white/70">
              <li className="flex items-start space-x-3">
                <FaPhone className="text-mustard mt-0.5 w-4 h-4 flex-shrink-0" />
                <div className="space-y-1">
                  <p>+234 803 589 6449</p>
                  <p>+234 907 660 5941</p>
                  <p>+234 813 008 1286</p>
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <FaMapMarkerAlt className="text-mustard mt-0.5 w-4 h-4 flex-shrink-0" />
                <div className="space-y-1">
                  <p>No 58b Isa Kaita Road, Kaduna</p>
                  <p>No 1b Marnona Road, Off Katuru Road, U/Sarki, Kaduna</p>
                </div>
              </li>
            </ul>

            {/* Social */}
            <div className="mt-5">
              <h4 className="font-semibold mb-3 text-sm">Follow Us</h4>
              <div className="flex space-x-3">
                <a
                  href="#"
                  aria-label="WhatsApp"
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-mustard hover:text-maroon flex items-center justify-center transition"
                >
                  <FaWhatsapp />
                </a>
                <a
                  href="https://www.instagram.com/elfijr_kitchen_/?hl=en"
                  aria-label="Instagram"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-mustard hover:text-maroon flex items-center justify-center transition"
                >
                  <FaInstagram />
                </a>
                <a
                  href="https://www.tiktok.com/@elfijr_kitchen_"
                  aria-label="TikTok"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-mustard hover:text-maroon flex items-center justify-center transition"
                >
                  <FaTiktok />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-maroon-dark pt-8 text-center text-sm text-white/70">
          <p>&copy; 2026 Elfijr Kitchen. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
