import { useContext } from 'react'
import { GameEngineContext } from '../context/GameEngineContext.jsx'

export function useGameEngine() {
  const context = useContext(GameEngineContext)
  if (!context) {
    throw new Error('useGameEngine must be used within GameEngineProvider')
  }
  return context
}

export default useGameEngine

