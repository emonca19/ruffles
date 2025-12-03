//pruebas funcionales par aprobar  el flujo y concurrencia 
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import GaleriaParticipacion from '../JSX/GaleriaParticipacion'

//mop