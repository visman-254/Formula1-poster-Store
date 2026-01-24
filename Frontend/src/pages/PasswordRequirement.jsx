function PasswordRequirement({ met, children }) {
  return (
    <p
      className={`text-sm ${
        met ? "text-green-600" : "text-red-500"
      }`}
    >
      {children}
    </p>
  );
}

export default PasswordRequirement;
