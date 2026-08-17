import React from 'react'
import vectorLogo from '../assets/vector_logo_white.png'

const Header = () => {
  return (
    <header className="bg-black text-white px-6 py-3 flex items-center justify-between border-b border-gray-800 shadow-lg relative">

      <div className="flex items-center">
        <img src={vectorLogo} alt="Vectorflow Logo" className="h-8 object-contain" />
      </div>
      <h1 className="text-xl font-bold tracking-wider text-white uppercase text-center absolute left-1/2 transform -translate-x-1/2">
        Diff Checker
      </h1>

      <div />

    </header>
  )
}

export default Header