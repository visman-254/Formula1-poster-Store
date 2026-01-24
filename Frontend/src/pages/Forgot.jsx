import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUser } from "../context/UserContext";
import './Login.css'

const Forgot = () => {
  const [email, setEmail] = useState("");
  const [isSuccess, setIsSuccess] = useState(null);
  const { forgotPassword } = useUser();
  const [message, setMessage] = useState("");


  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("Please wait...");
    setIsSuccess(null);


    const result = await forgotPassword(email);

    if (result.success) {
      setIsSuccess(true);
      setMessage(result.message);
    } else {
      setIsSuccess(false);
      setMessage(result.message);
    }

    

    
  };

  return (
    <div className="flex items-center justify-center py-12">
      <Card className="mx-auto max-w-sm w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Forgot Password</CardTitle>
          <CardDescription>
            Enter your email and we will send you a link to reset your password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="m@example.com"
                required
              />
            </div>
            <Button type="submit" className="login-button w-full">
              Send Reset Link
            </Button>
          </form>
          {message &&(
               <div className={`mt-4 text-center ${isSuccess ? 'text-green-500' : 'text-red-500'}`}>
              {message}
            </div>
          )}
          <div className="mt-4 text-center text-sm">
            Remember your password?{" "}
            <Link to="/login" className="underline">
              Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Forgot;
