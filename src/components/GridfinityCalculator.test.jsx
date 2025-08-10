import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import GridfinityCalculator from './GridfinityCalculator'
import { SettingsProvider } from '../contexts/SettingsContext'
import { saveUserSettings, loadUserSettings } from '../lib/utils'

// Mock the utils
vi.mock('../lib/utils', () => ({
  cn: vi.fn((inputs) => inputs),
  printerSizes: {
    'Test Printer': { x: 200, y: 200, z: 200 },
    'Bambu Lab A1': { x: 220, y: 220, z: 250 },
  },
  saveUserSettings: vi.fn(),
  loadUserSettings: vi.fn(),
}))

// Helper function to render with providers
const renderWithProviders = (component) => {
  return render(
    <SettingsProvider>
      {component}
    </SettingsProvider>
  )
}

describe('GridfinityCalculator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    loadUserSettings.mockReturnValue(null)
  })

  it('should render all main sections', () => {
    renderWithProviders(<GridfinityCalculator />)
    
    expect(screen.getByText('Drawer Dimensions')).toBeInTheDocument()
    expect(screen.getByText('Printer Settings')).toBeInTheDocument()
    expect(screen.getByText('Bin Options')).toBeInTheDocument()
    expect(screen.getByText('Drawer Options')).toBeInTheDocument()
  })

  it('should load saved settings on mount', () => {
    const savedSettings = {
      drawerSize: { width: 15, height: 12 },
      selectedPrinter: 'Test Printer',
      useHalfSize: true,
      preferHalfSize: false,
      numDrawers: 3,
      useMm: true,
    }
    
    loadUserSettings.mockReturnValue(savedSettings)
    renderWithProviders(<GridfinityCalculator />)
    
    expect(loadUserSettings).toHaveBeenCalled()
  })

  it('should save settings when values change', async () => {
    renderWithProviders(<GridfinityCalculator />)
    
    // Wait for initial render and save
    await waitFor(() => {
      expect(saveUserSettings).toHaveBeenCalled()
    })
    
    const initialCallCount = saveUserSettings.mock.calls.length
    
    // Change drawer width
    const widthInput = screen.getByLabelText(/width/i)
    await userEvent.clear(widthInput)
    await userEvent.type(widthInput, '20')
    
    await waitFor(() => {
      expect(saveUserSettings.mock.calls.length).toBeGreaterThan(initialCallCount)
    })
  })

  it('should display results when calculation completes', async () => {
    renderWithProviders(<GridfinityCalculator />)
    
    await waitFor(() => {
      // Look for "Results for X drawer(s)" text pattern
      expect(screen.getByText(/Results for \d+ drawer/)).toBeInTheDocument()
      expect(screen.getByText('Visual Preview')).toBeInTheDocument()
    })
  })

  it('should toggle between inches and millimeters', async () => {
    renderWithProviders(<GridfinityCalculator />)
    
    // Get the unit toggle switch by its ID
    const unitToggle = document.getElementById('unit-toggle')
    
    // Initially should show inches label
    const inchesLabel = screen.getByText('Inches')
    expect(inchesLabel).toBeInTheDocument()
    
    // Toggle to mm
    await userEvent.click(unitToggle)
    
    await waitFor(() => {
      // After toggling, the width/height labels should show mm
      expect(screen.getByText(/Width \(mm\)/)).toBeInTheDocument()
    })
  })

  it('should update printer selection', async () => {
    renderWithProviders(<GridfinityCalculator />)
    
    // Open printer dropdown
    const printerButton = screen.getByRole('combobox')
    await userEvent.click(printerButton)
    
    // Select a different printer
    const testPrinter = await screen.findByText('Test Printer')
    await userEvent.click(testPrinter)
    
    await waitFor(() => {
      const calls = saveUserSettings.mock.calls
      const hasTestPrinter = calls.some(call => 
        call[0]?.selectedPrinter === 'Test Printer'
      )
      expect(hasTestPrinter).toBe(true)
    })
  })

  it('should handle half-size bin options', async () => {
    renderWithProviders(<GridfinityCalculator />)
    
    const halfSizeCheckbox = screen.getByLabelText('Use only half-size bins (21x21mm)')
    
    await userEvent.click(halfSizeCheckbox)
    
    await waitFor(() => {
      const calls = saveUserSettings.mock.calls
      const hasHalfSize = calls.some(call => 
        call[0]?.useHalfSize === true
      )
      expect(hasHalfSize).toBe(true)
    })
  })

  it('should update number of drawers', async () => {
    renderWithProviders(<GridfinityCalculator />)
    
    // Find the input with the numDrawers id
    const drawerInput = document.getElementById('numDrawers')
    await userEvent.clear(drawerInput)
    await userEvent.type(drawerInput, '5')
    
    await waitFor(() => {
      const calls = saveUserSettings.mock.calls
      const hasFiveDrawers = calls.some(call => 
        call[0]?.numDrawers === 5
      )
      expect(hasFiveDrawers).toBe(true)
    })
  })

  it('should handle invalid drawer dimensions gracefully', async () => {
    renderWithProviders(<GridfinityCalculator />)
    
    const widthInput = screen.getByLabelText(/width/i)
    await userEvent.clear(widthInput)
    await userEvent.type(widthInput, '0')
    
    // Should still render without crashing
    expect(screen.getByText('Drawer Dimensions')).toBeInTheDocument()
  })

  it('should recalculate when dimensions change', async () => {
    renderWithProviders(<GridfinityCalculator />)
    
    const initialSaveCount = saveUserSettings.mock.calls.length
    
    const heightInput = screen.getByLabelText(/height/i)
    await userEvent.clear(heightInput)
    await userEvent.type(heightInput, '25')
    
    await waitFor(() => {
      expect(saveUserSettings.mock.calls.length).toBeGreaterThan(initialSaveCount)
      const lastCall = saveUserSettings.mock.calls[saveUserSettings.mock.calls.length - 1][0]
      expect(lastCall.drawerSize.height).toBe(25)
    })
  })
})