function DashboardCard({

  title,
  value

}) {

  return (

    <div style={{

      border: "1px solid #ccc",
      padding: "20px",
      borderRadius: "12px",
      backgroundColor: "#f8f8f8",
      boxShadow: "0 2px 8px rgba(0,0,0,0.08)"

    }}>

      <h3>
        {title}
      </h3>

      <p>
        {value}
      </p>

    </div>
  )
}

export default DashboardCard