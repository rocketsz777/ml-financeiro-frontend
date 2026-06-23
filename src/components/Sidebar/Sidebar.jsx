import "./Sidebar.css";

import { MdDashboard } from "react-icons/md";
import { FaShoppingCart } from "react-icons/fa";
import { FaBoxes } from "react-icons/fa";
import { SiMercadolibre } from "react-icons/si";

function Sidebar() {

  return (

    <aside className="sidebar">

      <div className="logo-area">

        <h2>Rocket Imports</h2>

      </div>

      <nav className="menu">

        <button className="menu-item active">
          <MdDashboard />
          Dashboard
        </button>

        <button className="menu-item">
          <FaShoppingCart />
          Vendas
        </button>

        <button className="menu-item">
          <FaBoxes />
          Produtos
        </button>

        <button className="menu-item">
          <SiMercadolibre />
          Mercado Livre
        </button>

      </nav>

    </aside>
  )
}

export default Sidebar;