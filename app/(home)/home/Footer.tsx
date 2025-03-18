import { Zap } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-10 md:py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          <div className="col-span-2 md:col-span-1 mb-6 md:mb-0">
            <div className="flex items-center gap-2 mb-3 md:mb-4">
              <Zap className="h-5 w-5 md:h-6 md:w-6" />
              <span className="text-lg md:text-xl font-bold">LeadHive</span>
            </div>
            <p className="text-gray-400 text-sm md:text-base max-w-xs">
              Transforming lead management for modern businesses.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-3 md:mb-4 text-sm md:text-base">Product</h4>
            <ul className="space-y-2">
              <li><a href="#features" className="text-gray-400 hover:text-white transition-colors text-xs md:text-sm">Features</a></li>
              <li><a href="#pricing" className="text-gray-400 hover:text-white transition-colors text-xs md:text-sm">Pricing</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-xs md:text-sm">Security</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-xs md:text-sm">Enterprise</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3 md:mb-4 text-sm md:text-base">Company</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-xs md:text-sm">About</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-xs md:text-sm">Careers</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-xs md:text-sm">Blog</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-xs md:text-sm">Contact</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3 md:mb-4 text-sm md:text-base">Legal</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-xs md:text-sm">Privacy</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-xs md:text-sm">Terms</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-xs md:text-sm">Cookie Policy</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-xs md:text-sm">Licenses</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 md:mt-12 pt-6 md:pt-8 text-center text-gray-400 text-xs md:text-sm">
          <p>&copy; {new Date().getFullYear()} LeadHive. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};