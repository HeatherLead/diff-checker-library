import React from 'react'
import vectorLogo from '../assets/vector_logo_white.png'

const Header = () => {
  return (
    <header className="dc-header">
      <div className="dc-header-logo-container">
        <img src={vectorLogo} alt="Vectorflow Logo" className="dc-header-logo" />
      </div>
      <h1 className="dc-header-title">
        Diff Checker
      </h1>
      <div />
    </header>
  )
}

export default Header