import { Link } from "react-router-dom";
import "../Navbar.css";

export default function Header() {
  return (
    <nav className="navbar">
      <h2>Echoverse</h2>

      <ul>
        <li><Link to="/">Home</Link></li>
        <li><Link to="/translator">Translator</Link></li>
        <li><Link to="/history">History</Link></li> {/* ✅ FIXED */}
        <li><Link to="/learn">Learn</Link></li>
      </ul>
    </nav>
  );
}
