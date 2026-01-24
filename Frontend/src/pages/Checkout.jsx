import React, { useState, useEffect} from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useCart } from "../context/CartContext";
import { useUser } from "../context/UserContext";
import Select from "react-select";

import API_BASE from "../config";
import {
  ShoppingCart,
  Trash2,
  CreditCard,
  Package,
  User,
  Phone,
  Mail,
  MapPin,
  ArrowLeft,
  Receipt
} from "lucide-react";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";

const Checkout = () => {
  const { user } = useUser();
  const { cartItems, totalItems, totalPrice, removeFromCart } = useCart();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [country, setCountry] = useState("KE");
  const navigate = useNavigate();
  const [wantsDelivery, setWantsDelivery] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState(0);
 const [location, setLocation] = useState(null);


 const deliveryRegions = {
  Nairobi: [
    { town: "Nairobi CBD", price: 400 },
    { town: "Westlands", price: 400 },
    { town: "Kilimani", price: 400 },
    { town: "Karen", price: 400 },
    { town: "Eastleigh", price: 400 },
    { town: "Kasarani", price: 400 },
    { town: "Embakasi", price: 400 },
    { town: "Donholm", price: 400 },
    { town: "Rongai", price: 400 },
  ],
  Mombasa: [
    { town: "Mombasa Island", price: 400 },
    { town: "Nyali", price: 400 },
    { town: "Bamburi", price: 400 },
    { town: "Likoni", price: 400 },
    { town: "Changamwe", price: 400 },
    { town: "Kisauni", price: 400 },
  ],
  Kisumu: [
    { town: "Kisumu City", price: 400 },
    { town: "Ahero", price: 400 },
    { town: "Maseno", price: 400 },
    { town: "Kondele", price: 400 },
    { town: "Mamboleo", price: 400 },
  ],
  Nakuru: [
    { town: "Nakuru Town", price: 350 },
    { town: "Naivasha", price: 350 },
    { town: "Gilgil", price: 350 },
    { town: "Njoro", price: 350 },
    { town: "Molo", price: 350 },
    { town: "Bahati", price: 350 },
  ],
  UasinGishu: [
    { town: "Eldoret", price: 150 },
    { town: "Burnt Forest", price: 350 },
    { town: "Turbo", price: 350 },
    { town: "Moiben", price: 350 },
    { town: "Jua Kali", price: 350 },
    { town: "Maili Nne", price: 250 },
  ],
  Kiambu: [
    { town: "Thika", price: 400 },
    { town: "Kiambu Town", price: 400 },
    { town: "Ruiru", price: 400 },
    { town: "Githunguri", price: 400 },
    { town: "Limuru", price: 400 },
    { town: "Kabete", price: 400 },
    { town: "Kikuyu", price: 400 },
  ],
  Kisii: [
    { town: "Kisii Town", price: 450 },
    { town: "Ogembo", price: 450 },
    { town: "Nyamache", price: 450 },
  ],
  Kakamega: [
    { town: "Kakamega Town", price: 400 },
    { town: "Mumias", price: 400 },
    { town: "Malava", price: 400 },
    { town: "Lugari", price: 400 },
  ],
  Bungoma: [
    { town: "Bungoma Town", price: 400 },
    { town: "Webuye", price: 400 },
    { town: "Kimilili", price: 400 },
    { town: "Chwele", price: 400 },
    { town: "Mt Elgon", price: 400 },
  ],
  TransNzoia: [
    { town: "Kitale", price: 400 },
    { town: "Kiminini", price: 400 },
    { town: "Endebess", price: 400 },
  ],
  Nandi: [
    { town: "Kapsabet", price: 350 },
    { town: "Nandi Hills", price: 350 },
    { town: "Mosoriot", price: 350 },
  ],
  Machakos: [
    { town: "Machakos Town", price: 350 },
    { town: "Athi River", price: 350 },
    { town: "Mlolongo", price: 350 },
    { town: "Kangundo", price: 350 },
    { town: "Masinga", price: 350 },
  ],
  Kajiado: [
    { town: "Kitengela", price: 400 },
    { town: "Kajiado Town", price: 400 },
    { town: "Ngong", price: 400 },
    { town: "Ongata Rongai", price: 400 },
    { town: "Isinya", price: 400 },
  ],
  Nyeri: [
    { town: "Nyeri Town", price: 350 },
    { town: "Karatina", price: 350 },
    { town: "Othaya", price: 350 },
    { town: "Mukurweini", price: 350 },
  ],
  Meru: [
    { town: "Meru Town", price: 400 },
    { town: "Maua", price: 400 },
    { town: "Timau", price: 400 },
    { town: "Kibirichia", price: 400 },
  ],
  Embu: [
    { town: "Embu Town", price: 400 },
    { town: "Runyenjes", price: 400 },
    { town: "Siakago", price: 400 },
  ],
  Kericho: [
    { town: "Kericho Town", price: 350 },
    { town: "Londiani", price: 350 },
    { town: "Litein", price: 350 },
  ],
  Bomet: [
    { town: "Bomet Town", price: 350 },
    { town: "Sotik", price: 350 },
    { town: "Longisa", price: 350 },
  ],
  Narok: [
    { town: "Narok Town", price: 400 },
    { town: "Kilgoris", price: 400 },
    { town: "Ololulung’a", price: 400 },
  ],
  HomaBay: [
    { town: "Homa Bay Town", price: 400 },
    { town: "Mbita", price: 400 },
    { town: "Oyugis", price: 400 },
  ],
  Migori: [
    { town: "Migori Town", price: 400 },
    { town: "Isebania", price: 400 },
    { town: "Awendo", price: 400 },
    { town: "Rongo", price: 400 },
  ],
  Turkana: [
    { town: "Lodwar", price: 600 },
    { town: "Lokichoggio", price: 600 },
    { town: "Kakuma", price: 600 },
  ],
  Garissa: [
    { town: "Garissa Town", price: 500 },
    { town: "Masalani", price: 500 },
    { town: "Hulugho", price: 500 },
  ],
  Wajir: [
    { town: "Wajir Town", price: 600 },
    { town: "Griftu", price: 600 },
    { town: "Habaswein", price: 600 },
  ],
  Mandera: [
    { town: "Mandera Town", price: 600 },
    { town: "Elwak", price: 600 },
    { town: "Rhamu", price: 600 },
  ],
  TaitaTaveta: [
    { town: "Voi", price: 400 },
    { town: "Taveta", price: 400 },
    { town: "Wundanyi", price: 400 },
  ],
  Lamu: [
    { town: "Lamu Town", price: 500 },
    { town: "Mpeketoni", price: 500 },
    { town: "Faza", price: 500 },
  ],
  Kilifi: [
    { town: "Kilifi Town", price: 400 },
    { town: "Malindi", price: 400 },
    { town: "Kaloleni", price: 400 },
    { town: "Rabai", price: 400 },
  ],
  Kwale: [
    { town: "Ukunda", price: 400 },
    { town: "Diani", price: 400 },
    { town: "Msambweni", price: 400 },
  ],
  Isiolo: [
    { town: "Isiolo Town", price: 500 },
    { town: "Gedio", price: 500 },
    { town: "Kinna", price: 500 },
  ],
  Laikipia: [
    { town: "Nanyuki", price: 450 },
    { town: "Rumuruti", price: 450 },
    { town: "Laikipia North", price: 450 },
  ],
  Marsabit: [
    { town: "Marsabit Town", price: 600 },
    { town: "Moyale", price: 600 },
    { town: "Laisamis", price: 600 },
  ],
  Nyandarua: [
    { town: "Ol Kalou", price: 400 },
    { town: "Engineer", price: 400 },
    { town: "Njabini", price: 400 },
  ],
  Muranga: [
    { town: "Murang'a Town", price: 400 },
    { town: "Kangema", price: 400 },
    { town: "Kigumo", price: 400 },
  ],
  Kirinyaga: [
    { town: "Kerugoya", price: 400 },
    { town: "Kutus", price: 400 },
    { town: "Sagana", price: 400 },
  ],
  Busia: [
    { town: "Busia Town", price: 400 },
    { town: "Malaba", price: 400 },
    { town: "Port Victoria", price: 400 },
  ],
  Siaya: [
    { town: "Siaya Town", price: 400 },
    { town: "Bondo", price: 400 },
    { town: "Ugunja", price: 400 },
  ],
  Vihiga: [
    { town: "Vihiga Town", price: 400 },
    { town: "Mbale", price: 400 },
    { town: "Luanda", price: 400 },
    { town:"test", price: 1},
  ],
  TharakaNithi: [
    { town: "Chuka", price: 400 },
    { town: "Chogoria", price: 400 },
    { town: "Marimanti", price: 400 },
  ],
  Nyamira: [
    { town: "Nyamira Town", price: 400 },
    { town: "Keroka", price: 400 },
    { town: "Ikonge", price: 400 },
  ],
  TanaRiver: [
    { town: "Hola", price: 500 },
    { town: "Garsen", price: 500 },
    { town: "Bura", price: 500 },
  ],
  WestPokot: [
    { town: "Kapenguria", price: 450 },
    { town: "Makutano", price: 450 },
    { town: "Chepareria", price: 450 },
  ],
  Samburu: [
    { town: "Maralal", price: 550 },
    { town: "Baragoi", price: 550 },
    { town: "Wamba", price: 550 },
  ],
};

const customSelectStyles = {
  control: (provided, state) => ({
    ...provided,
    backgroundColor: state.selectProps.theme === "dark" ? "#000" : "#fff",
    color: state.selectProps.theme === "dark" ? "#fff" : "#000",
    borderColor: "#ccc",
    minHeight: "48px",
    boxShadow: "none",
    "&:hover": {
      borderColor: "#888",
    },
  }),
  singleValue: (provided, state) => ({
    ...provided,
    color: state.selectProps.theme === "dark" ? "#fff" : "#000",
  }),
  menu: (provided, state) => ({
    ...provided,
    backgroundColor: state.selectProps.theme === "dark" ? "#000" : "#fff",
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isFocused
      ? state.selectProps.theme === "dark"
        ? "#222"
        : "#eee"
      : state.selectProps.theme === "dark"
      ? "#000"
      : "#fff",
    color: state.selectProps.theme === "dark" ? "#fff" : "#000",
    cursor: "pointer",
  }),
  placeholder: (provided, state) => ({
    ...provided,
    color: state.selectProps.theme === "dark" ? "#aaa" : "#666",
  }),
  input: (provided, state) => ({
    ...provided,
    color: state.selectProps.theme === "dark" ? "#fff" : "#000",
  }),
  dropdownIndicator: (provided, state) => ({
    ...provided,
    color: state.selectProps.theme === "dark" ? "#fff" : "#000",
    "&:hover": {
      color: state.selectProps.theme === "dark" ? "#fff" : "#000",
    },
  }),
  indicatorSeparator: (provided, state) => ({
    ...provided,
    backgroundColor: state.selectProps.theme === "dark" ? "#807e7eff" : "#ccc",
  }),
};

  
 const themeMode = document.documentElement.classList.contains("dark")
    ? "dark"
    : "light";

const getDeliveryFee = (address) => {
  if (!address) return 0;
  const lowerAddress = address.toLowerCase();

  for (const county in deliveryRegions) {
    for (const townObj of deliveryRegions[county]) {
      if (lowerAddress.includes(townObj.town.toLowerCase())) {
        return townObj.price;
      }
    }
  }

  // Default delivery fee if town not found
  return 0;
};


useEffect(() => {
  if (wantsDelivery && address.trim() !== "") {
    const fee = getDeliveryFee(address);
    setDeliveryFee(fee);
  } else {
    setDeliveryFee(0);
  }
}, [address, wantsDelivery]);




  const handleCheckout = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!user) {
      toast.error("You need to be logged in to place an order.");
      setIsSubmitting(false);
      return;
    }

    if (!name || !phone || !email) {
      toast.error("Please fill in your name, phone, and email.");
      setIsSubmitting(false);
      return;
    }

    if (wantsDelivery && !address) {
      toast.error("Please select a delivery location.");
      setIsSubmitting(false);
      return;
    }

    if (cartItems.length === 0) {
      toast.error("Your cart is empty.");
      setIsSubmitting(false);
      return;
    }

    // Clean the phone number for backend
    const formattedPhone = phone.replace(/\D/g, "");

    // If the user is not Kenyan, show info instead of triggering M-Pesa
    if (!phone.startsWith("+254")) {
      toast.info("Currently, M-Pesa payments are only available for Kenyan numbers.");
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = {
        amount: totalPrice + deliveryFee,
        phoneNumber: formattedPhone,
        user_id: user.id,
        cartItems: cartItems.map((ci) => ({
          variant_id: ci.variant_id,
          quantity: ci.quantity,
          price: ci.price,
          title: ci.title || null,
          image: ci.image || null,
        })),
        deliveryFee: deliveryFee,
        address: address,
      };

      const { data } = await axios.post(`${API_BASE}/api/mpesa/stkpush`, payload);

      if (data?.success) {
        toast.success("Confirm payment on your phone. Waiting for confirmation...");
        navigate("/pendingpayments", {
          state: {
            checkoutRequestID: data.checkoutRequestID,
            amount: totalPrice + deliveryFee,
            phone: formattedPhone,
          },
        });
      } else {
        toast.error("Failed to initiate payment. Try again.");
      }
    } catch (error) {
      console.error("Checkout error:", error.response?.data || error);
      toast.error("There was an issue starting the payment. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resolveImageUrl = (image) => {
    if (image && (image.startsWith("http") || image.startsWith("/"))) return image;
    return `${API_BASE}/${image}`;
  };

  // Render bundled images or single image for checkout
  const renderCheckoutImage = (item) => {
    if (
      item.is_bundle &&
      Array.isArray(item.bundle_products) &&
      item.bundle_products.length >= 2
    ) {
      const leftImage =
        item.bundle_products[0]?.variants?.[0]?.image ||
        item.bundle_products[0]?.primaryImage;
      const rightImage =
        item.bundle_products[1]?.variants?.[0]?.image ||
        item.bundle_products[1]?.primaryImage;

      if (leftImage && rightImage) {
        return (
          <div className="bundle-image-splice-checkout">
            <img
              src={resolveImageUrl(leftImage)}
              className="bundle-splice-image-left-checkout"
              alt="Bundle item 1"
            />
            <img
              src={resolveImageUrl(rightImage)}
              className="bundle-splice-image-right-checkout"
              alt="Bundle item 2"
            />
          </div>
        );
      }
    }

    // Single product fallback
    return <img src={resolveImageUrl(item.image)} alt={item.title} className="w-full h-full object-cover" />;
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black py-8 px-4 font-sans">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link to="/cart" className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Cart
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold text-black dark:text-white mb-2">
            Checkout
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Complete your order and proceed to payment
          </p>
        </div>

        {cartItems.length === 0 ? (
          <Card className="border-0 shadow-none">
            <CardContent className="py-20 text-center">
              <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center mx-auto mb-6">
                <ShoppingCart className="w-12 h-12 text-slate-400 dark:text-slate-600" />
              </div>
              <h3 className="text-2xl font-bold text-black dark:text-white mb-3">
                Your cart is empty
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Add some items to your cart to continue shopping
              </p>
              <Link to="/orders">
                <Button className="bg-black hover:bg-slate-800 dark:bg-gray-800 dark:hover:bg-slate-200 text-white dark:text-black dark:text-white font-semibold">
                  <Receipt className="w-4 h-4 mr-2 dark:text-white" />
                  View Order History
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-2 gap-8">
           
            <div className="space-y-6">
              <Card className="border-0 shadow-none">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-black dark:text-white flex items-center gap-2">
                    <Package className="w-6 h-6" />
                    Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {cartItems.map((item) => (
                      <div
                        key={item.variant_id}
                        className="flex gap-4 p-4 rounded-lg transition-colors"
                      >
                        <div className="w-20 h-20 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-900">
                          {renderCheckoutImage(item)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-black dark:text-white mb-2 truncate">
                            {item.title}
                          </h4>
                          <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                            Kshs {parseFloat(item.price).toFixed(2)} × {parseInt(item.quantity)}
                          </div>
                          <div className="font-bold text-black dark:text-white">
                            Kshs {(parseFloat(item.price) * parseInt(item.quantity)).toFixed(2)}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="icon"
                          className="flex-shrink-0 text-white dark:text-red-400 border-0"
                          onClick={() => removeFromCart(item.variant_id, item.title)}
                        >
                          <Trash2 className="w-4 text-white h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  {/* Totals */}
                  <div className="mt-6 pt-6 space-y-3">
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span className="font-medium">Total Items</span>
                      <span className="font-semibold">{totalItems}</span>
                    </div>
                    <div className="flex justify-between items-center text-2xl font-bold">
                      <span className="text-black dark:text-white">Total</span>
                      <span className="text-black dark:text-white">
                        Kshs {totalPrice.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Payment Details */}
            <div className="space-y-6">
              <Card className="border-0 shadow-none">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-black dark:text-white flex items-center gap-2">
                    <CreditCard className="w-6 h-6" />
                    Payment Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <form onSubmit={handleCheckout} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-black dark:text-white font-semibold flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Full Name
                      </Label>
                      <Input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        disabled={isSubmitting}
                        className="bg-white dark:bg-black text-black dark:text-white h-12 border-1"
                        placeholder="Enter your full name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-black dark:text-white font-semibold flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        Phone Number
                      </Label>
                      <div className="phone-input-wrapper">
                        <PhoneInput
                          id="phone"
                          international
                          defaultCountry={country}
                          value={phone}
                          onChange={(val) => setPhone(val || "")}
                          disabled={isSubmitting}
                          placeholder="Enter phone number"
                          className="bg-white dark:bg-black text-black dark:text-white h-12 border-1" 
                        />
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                       This number will be used to contact you about your order (e.g. +254712345678)
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-black dark:text-white font-semibold flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Email Address
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isSubmitting}
                        className="bg-white dark:bg-black text-black dark:text-white h-12 border-1"
                        placeholder="your@email.com"
                      />
                    </div>

                    

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="wantsDelivery"
                        checked={wantsDelivery}
                        onChange={(e) => setWantsDelivery(e.target.checked)}
                        />
                        <Label htmlFor="wantsDelivery" className="text-black dark:text-white font-semibold flex items-center gap-2">
                          <Package className="w-4 h-4" />
                          I want my order delivered
                        </Label>

                       


                    </div>
                   {wantsDelivery && (
                      <div className="space-y-2">
                        <Label
                          htmlFor="address"
                          className="text-black dark:text-white font-semibold flex items-center gap-2"
                        >
                          <MapPin className="w-4 h-4" />
                          Delivery Location
                        </Label>
                        <Select
                          value={location}
                          onChange={(selectedOption) => {
                            setLocation(selectedOption);
                            setAddress(selectedOption?.value || "");
                          }}
                          options={Object.keys(deliveryRegions).flatMap((county) =>
                            deliveryRegions[county].map((townObj) => ({
                              value: townObj.town,
                              label: `${townObj.town} (Kshs ${townObj.price})`,
                            }))
                          )}
                          isDisabled={isSubmitting}
                          placeholder="Select your town"
                          classNamePrefix="react-select"
                          styles={customSelectStyles}
                          theme={themeMode}
                        />
                      </div>
                    )}

                   <Button
  type="submit"
  disabled={isSubmitting}
  className="pay w-full h-14 bg-foreground text-background hover:bg-foreground/90 dark:bg-black dark:text-foreground dark:hover:bg-background/90 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed border-0"
>
                      {isSubmitting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white dark:border-black border-t-transparent dark:border-t-transparent rounded-full animate-spin mr-2" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-5 h-5 mr-2 bg-black" />
                        Pay with M-Pesa (Kshs {(totalPrice + deliveryFee).toFixed(2)})

                        </>
                      )}
                    </Button>

                    <div className="pt-4">
                      <Link to="/cart">
                        <Button
                          type="button"
                          variant="outline"
                           className="w-full h-14 bg-foreground text-background hover:bg-foreground/90 dark:bg-background dark:text-foreground dark:hover:bg-background/90 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed border-0"
                        >
                          <ArrowLeft className="w-4 h-4 mr-2" />
                          Edit Cart
                        </Button>
                      </Link>
                    </div>
                  </form>

                
                  <div className="mt-6 pt-6">
                    <div className="flex items-center justify-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-green-600 dark:bg-green-400" />
                      </div>
                      <span>Secure payment via M-Pesa</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Checkout;