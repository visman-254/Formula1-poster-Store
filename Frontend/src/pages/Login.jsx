import {  useEffect, useState } from "react";
import { Link, useNavigate,  useLocation} from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUser } from "../context/UserContext";
import { useForm } from "../hooks/useForm";
import { validateLogin } from "../utils/validators";
import { Eye, EyeOff } from "lucide-react";
import "./Login.css";

export default function Login() {
const { login } = useUser();
const navigate = useNavigate();
const location = useLocation();

const [showPassword, setShowPassword] = useState(false);
const [expiredMessage, setExpiredMessage] = useState("");

useEffect(() => {
const msg = sessionStorage.getItem("expiredMessage");
if (msg) {
setExpiredMessage(msg);
sessionStorage.removeItem("expiredMessage");
}
}, []);

const { values, errors, handleChange, handleSubmit } = useForm(
{ username: "", password: "" },
validateLogin
);

const handleLogin = async (formValues) => {
try {
const loggedInUser = await login(formValues);
navigate(loggedInUser.role === "admin" ? "/admin" : "/");
} catch (err) {
console.error("Login failed", err);
alert("Invalid username or password");
}
};

return ( <div className="login-container">
{expiredMessage && <div className="alert alert-warning text-center text-sm mt-4 text-yellow-700">{expiredMessage}</div>}

  <div className="flex items-center justify-center py-12">
    <Card className="login-card mx-auto max-w-sm w-full">
      <CardHeader>
        <CardTitle className="text-2xl">Login</CardTitle>
        <CardDescription>Enter your username below to log in to your account</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleLogin)} noValidate className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              name="username"
              type="text"
              value={values.username}
              onChange={handleChange}
              placeholder="johndoe"
            />
            {errors.username && <p className="text-sm text-red-500">{errors.username}</p>}
          </div>

          <div className="grid gap-2">
            <div className="flex items-center">
              <Label htmlFor="password">Password</Label>
              <Link to="/forgot" className="ml-auto inline-block text-sm underline">
                Forgot your password?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                name="password"
                placeholder="••••••••"
                type={showPassword ? "text" : "password"}
                value={values.password}
                onChange={handleChange}
                className="pr-10 bg-white"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 bg-white"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                <span className="sr-only">{showPassword ? "Hide" : "Show"} password</span>
              </Button>
              {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
            </div>
          </div>

          

          <Button type="submit" className="login-button w-full dark:text-white">
            Login
          </Button>
        </form>
        <div className="mt-4 text-center text-sm">
          Don&apos;t have an account? <Link to="/signup" className="underline">Signup</Link>
        </div>
      </CardContent>
    </Card>
  </div>
</div>


);
}
