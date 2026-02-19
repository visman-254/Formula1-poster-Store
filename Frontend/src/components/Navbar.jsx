// src/components/Navbar.jsx
import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import { Disclosure } from "@headlessui/react";
import { Menu, X, ShoppingCart, House, ChevronDown, Search, User } from "lucide-react";

import { useUser } from "../context/UserContext";
import { useCart } from "../context/CartContext";
import API_BASE from "../config";
import "./Navbar.css";
import logo from "../assets/pmc.png";
import logoDark from "../assets/pmc2.png";
import ThemeSwitcher from "./ThemeSwitcher";
import { Input } from "@/components/ui/input";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";

// Portal backdrop — renders directly on <body>
const Backdrop = ({ onClick }) =>
  ReactDOM.createPortal(
    <div className="mobile-backdrop" onClick={onClick} />,
    document.body
  );

// Portal mobile dropdown — renders directly on <body> to escape nav's stacking context
const MobileDropdownPortal = ({ children }) =>
  ReactDOM.createPortal(
    <div className="mobile-dropdown-portal">{children}</div>,
    document.body
  );

// Portal mobile search overlay — same fix
const MobileSearchPortal = ({ children }) =>
  ReactDOM.createPortal(
    <div className="mobile-search-portal">{children}</div>,
    document.body
  );

const Navbar = ({ searchQuery, setSearchQuery }) => {
  const [categories, setCategories] = useState([]);
  const { user, logout } = useUser();
  const { cartItems } = useCart();
  const navigate = useNavigate();
  const [currentLogo, setCurrentLogo] = useState(logo);
  const [openMobileSubmenu, setOpenMobileSubmenu] = useState(null);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const handleSearchChange = (e) => setSearchQuery(e.target.value);

  useEffect(() => {
    fetch(`${API_BASE}/api/products/categories`)
      .then((res) => res.json())
      .then((data) => {
        const filteredData = Array.isArray(data)
          ? data.filter((cat) => cat.category_name.toLowerCase() !== "preorders")
          : [];
        setCategories(filteredData);
      })
      .catch((err) => console.error("Error fetching categories:", err));
  }, []);

  useEffect(() => {
    const updateLogo = () => {
      const isDark = document.documentElement.classList.contains("dark");
      setCurrentLogo(isDark ? logoDark : logo);
    };
    updateLogo();
    const observer = new MutationObserver(updateLogo);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);

  const handleMobileLinkClick = (close) => {
    close();
    setOpenMobileSubmenu(null);
  };

  const toggleMobileSubmenu = (categoryId) => {
    setOpenMobileSubmenu(openMobileSubmenu === categoryId ? null : categoryId);
  };

  const renderMobileCategories = (cats, close, level = 0) => {
    return cats.map((cat) => {
      const hasSubcategories = cat.subcategories && cat.subcategories.length > 0;
      return (
        <div key={cat.category_id} className={`w-full ${level > 0 ? "ml-4" : ""}`}>
          {hasSubcategories ? (
            <div className="mobile-category-with-sub">
              <button
                type="button"
                onClick={() => toggleMobileSubmenu(cat.category_id)}
                className={`mobile-link cursor-pointer flex justify-between items-center w-full text-left ${
                  openMobileSubmenu === cat.category_id ? "bg-gray-100 dark:bg-gray-800" : ""
                }`}
                style={{ paddingLeft: `${1 + level * 0.5}rem` }}
              >
                <span>{cat.category_name}</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    openMobileSubmenu === cat.category_id ? "rotate-180" : ""
                  }`}
                />
              </button>
              {openMobileSubmenu === cat.category_id && (
                <div className="mobile-submenu ml-2 border-l-2 border-gray-200 dark:border-gray-700">
                  {renderMobileCategories(cat.subcategories, close, level + 1)}
                </div>
              )}
            </div>
          ) : (
            <Link
              to={`/products/category/${cat.category_name}`}
              className="mobile-link block"
              onClick={() => handleMobileLinkClick(close)}
              style={{ paddingLeft: `${1 + level * 0.5}rem` }}
            >
              {cat.category_name}
            </Link>
          )}
        </div>
      );
    });
  };

  return (
    <Disclosure as="nav" className="glass-nav">
      {({ open, close }) => {
        // Manage body scroll lock — saves scroll position for iOS
        useEffect(() => {
          if (open || isMobileSearchOpen) {
            const scrollY = window.scrollY;
            document.body.style.top = `-${scrollY}px`;
            document.body.classList.add("body-no-scroll");
          } else {
            const scrollY = document.body.style.top;
            document.body.classList.remove("body-no-scroll");
            document.body.style.top = "";
            if (scrollY) {
              window.scrollTo(0, parseInt(scrollY || "0") * -1);
            }
          }
          return () => {
            document.body.classList.remove("body-no-scroll");
            document.body.style.top = "";
          };
        }, [open, isMobileSearchOpen]);

        return (
          <>
            {/* Backdrop rendered via portal to escape nav stacking context */}
            {(open || isMobileSearchOpen) && (
              <Backdrop
                onClick={() => {
                  if (open) close();
                  if (isMobileSearchOpen) setIsMobileSearchOpen(false);
                }}
              />
            )}

            <div className="nav-content">
              {/* Logo */}
              <div className="flex items-center">
                <Link to="/home" className="logo-image">
                  <img src={currentLogo} alt="logo" />
                </Link>
              </div>

              {/* Desktop Navigation */}
              <div className="hidden md:flex md:items-center md:gap-4">
                <Link to="/home" className="nav-link">
                  <House className="h-4 w-4" /> Home
                </Link>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="products flex items-center gap-1">
                      Products <ChevronDown className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="nav-dropdown">
                    <DropdownMenuItem asChild>
                      <Link to="/">All</Link>
                    </DropdownMenuItem>
                    {categories.length > 0 ? (
                      categories.map((cat) =>
                        cat.subcategories && cat.subcategories.length > 0 ? (
                          <DropdownMenuSub key={cat.category_id}>
                            <DropdownMenuSubTrigger>{cat.category_name}</DropdownMenuSubTrigger>
                            <DropdownMenuSubContent
                              sideOffset={8}
                              alignOffset={-4}
                              avoidCollisions={true}
                              collisionPadding={20}
                            >
                              {cat.subcategories.map((sub) => (
                                <DropdownMenuItem asChild key={sub.category_id}>
                                  <Link to={`/products/category/${sub.category_name}`}>
                                    {sub.category_name}
                                  </Link>
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>
                        ) : (
                          <DropdownMenuItem asChild key={cat.category_id}>
                            <Link to={`/products/category/${cat.category_name}`}>
                              {cat.category_name}
                            </Link>
                          </DropdownMenuItem>
                        )
                      )
                    ) : (
                      <div className="dropdown-no-results">No categories found</div>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                <Link to="/cart" className="nav-link relative">
                  <ShoppingCart className="h-4 w-4" /> Cart
                  {totalItems > 0 && <div className="cart-badge">{totalItems}</div>}
                </Link>

                <Link to="/preorder" className="nav-link">
                  Pre-order
                </Link>

                <ThemeSwitcher />

                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="nav-link">
                        <div className="flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 px-3 py-1 text-sm font-bold text-gray-800 dark:text-white">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="nav-dropdown">
                      <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Link to="/login" className="nav-link">
                    Login
                  </Link>
                )}

                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 h-3.5 w-3.5" />
                  <Input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="pl-8 pr-3 py-1 h-8 text-sm rounded-md focus:border-transparent dark:border-gray-900 dark:text-white w-48"
                  />
                </div>
              </div>

              {/* Mobile Right Side Icons */}
              <div className="md:hidden flex items-center justify-center gap-2">
                <button
                  onClick={() => setIsMobileSearchOpen(true)}
                  className="p-2 bg-transparent"
                >
                  <Search className="h-6 w-6 text-gray-800 dark:text-white" />
                </button>
                <ThemeSwitcher />
                <Link to="/cart" className="p-2 relative bg-transparent">
                  <ShoppingCart className="h-6 w-6 text-gray-800 dark:text-gray-100" />
                  {totalItems > 0 && <div className="cart-badge-mobile">{totalItems}</div>}
                </Link>
                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-2 bg-transparent">
                        <div className="h-6 w-6 flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white font-bold text-xs">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="nav-dropdown">
                      <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Link to="/login" className="p-2 bg-transparent">
                    <User className="h-6 w-6 text-gray-800 dark:text-white" />
                  </Link>
                )}
                <Disclosure.Button className="mobile-toggle md:hidden">
                  {open ? (
                    <X className="h-6 w-6 text-gray-800 dark:text-white" />
                  ) : (
                    <Menu className="h-6 w-6 text-gray-800 dark:text-white" />
                  )}
                </Disclosure.Button>
              </div>
            </div>

            {/* Mobile Search — rendered via portal to escape nav stacking context */}
            {isMobileSearchOpen && (
              <MobileSearchPortal>
                <div className="mobile-search-overlay">
                  <div className="flex items-center gap-2 h-full px-4">
                    <div className="relative flex-grow">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        type="text"
                        placeholder="Search products..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        className="pl-10 pr-3 py-2 h-10 text-sm rounded-md focus:border-transparent dark:border-gray-900 dark:text-white w-full"
                        autoFocus
                      />
                    </div>
                    <button
                      onClick={() => setIsMobileSearchOpen(false)}
                      className="p-2 bg-transparent"
                    >
                      <X className="h-6 w-6 text-gray-800 dark:text-white" />
                    </button>
                  </div>
                </div>
              </MobileSearchPortal>
            )}

            {/* Mobile Dropdown — rendered via portal to escape nav's backdrop-filter stacking context */}
            <Disclosure.Panel>
              {open && (
                <MobileDropdownPortal>
                  <div className="mobile-list">
                    <Link
                      to="/home"
                      className="mobile-link"
                      onClick={() => handleMobileLinkClick(close)}
                    >
                      Home
                    </Link>

                    <Link
                      to="/preorder"
                      className="mobile-link"
                      onClick={() => handleMobileLinkClick(close)}
                    >
                      Pre-order
                    </Link>

                    {/* Mobile Products Section */}
                    <div className="w-full">
                      <div className="mobile-link font-semibold border-b border-gray-200 dark:border-gray-700 mb-2">
                        Products
                      </div>

                      <Link
                        to="/"
                        className="mobile-link mobile-all-products"
                        onClick={() => handleMobileLinkClick(close)}
                      >
                        All Products
                      </Link>

                      <div className="space-y-1 max-h-96 overflow-y-auto">
                        {renderMobileCategories(categories, close)}
                      </div>
                    </div>

                  </div>
                </MobileDropdownPortal>
              )}
            </Disclosure.Panel>
          </>
        );
      }}
    </Disclosure>
  );
};

export default Navbar;