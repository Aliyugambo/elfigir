'use client';

import Link from 'next/link';
import Image from 'next/image';
import logo from '@/logo.png';
import { FaPhone, FaMapMarkerAlt, FaWhatsapp, FaInstagram } from 'react-icons/fa';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Image src={logo} alt="Elfigir" width={32} height={32} className="w-8 h-8" />
              <span className="text-lg font-bold">Elfigir</span>
            </div>
            <p className="text-gray-400 text-sm">
              Modern food delivery platform connecting you with your favorite restaurants.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link href="/restaurants" className="hover:text-white transition">
                  Browse Restaurants
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
            <ul className="space-y-2 text-sm text-gray-400">
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
            <div className="space-y-3 text-sm text-gray-400">
              <p className="flex items-center space-x-2">
                <FaPhone className="text-primary" />
                <span>+234 123 456 7890</span>
              </p>
              <p className="flex items-center space-x-2">
                <FaMapMarkerAlt className="text-primary" />
                <span>Lagos, Nigeria</span>
              </p>
              <div className="flex space-x-4 pt-2">
                <a href="#" className="hover:text-white transition">
                  <FaWhatsapp />
                </a>
                <a href="#" className="hover:text-white transition">
                  <FaInstagram />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
          <p>&copy; 2024 Elfigir. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
