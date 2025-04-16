import { jest } from '@jest/globals';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { GameControls } from '../GameControls';
import { createMockGameState } from '../../../test/testUtils';

describe('GameControls', () => {
  const defaultProps = {
    gameState: createMockGameState(),
    onStartOver: jest.fn<() => void>(),
    onGiveUp: jest.fn<() => Promise<void>>().mockResolvedValue()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows correct counter when no Pokemon are caught', () => {
    const gameState = createMockGameState({ caughtPokemon: [], totalPokemon: 10 });
    render(<GameControls {...defaultProps} gameState={gameState} />);
    
    expect(screen.getByText("You've caught 0 Pokemon! 10 to go!")).toBeInTheDocument();
  });

  it('shows correct counter when some Pokemon are caught', () => {
    const gameState = createMockGameState({ 
      caughtPokemon: [
        { name: 'pikachu', sprite: '/sprites/pikachu.png', types: ['Electric'] },
        { name: 'charizard', sprite: '/sprites/charizard.png', types: ['Fire', 'Flying'] }
      ], 
      totalPokemon: 10 
    });
    render(<GameControls {...defaultProps} gameState={gameState} />);
    
    expect(screen.getByText("You've caught 2 Pokemon! 8 to go!")).toBeInTheDocument();
  });

  it('shows congratulations message when all Pokemon are caught', () => {
    const gameState = createMockGameState({ 
      caughtPokemon: [
        { name: 'pikachu', sprite: '/sprites/pikachu.png', types: ['Electric'] },
        { name: 'charizard', sprite: '/sprites/charizard.png', types: ['Fire', 'Flying'] }
      ], 
      totalPokemon: 2 
    });
    render(<GameControls {...defaultProps} gameState={gameState} />);
    
    expect(screen.getByText("Congratulations! You've caught all 2 Pokemon!")).toBeInTheDocument();
  });

  it('shows loading dots when total is loading', () => {
    const gameState = createMockGameState({ isTotalLoading: true });
    render(<GameControls {...defaultProps} gameState={gameState} />);
    
    const loadingDots = screen.getByRole('status', { name: 'Loading' });
    expect(loadingDots).toBeInTheDocument();
    expect(loadingDots.classList.contains('loading-dots')).toBe(true);
  });

  it('hides counter when there are no results', () => {
    const gameState = createMockGameState({ noResults: true });
    render(<GameControls {...defaultProps} gameState={gameState} />);
    
    expect(screen.queryByText(/You've caught/)).not.toBeInTheDocument();
  });

  it('shows Start Over button when Pokemon are caught', () => {
    const gameState = createMockGameState({ 
      caughtPokemon: [{ name: 'pikachu', sprite: '/sprites/pikachu.png', types: ['Electric'] }]
    });
    render(<GameControls {...defaultProps} gameState={gameState} />);
    
    const startOverButton = screen.getByText('Start Over');
    expect(startOverButton).toBeInTheDocument();
    
    fireEvent.click(startOverButton);
    expect(defaultProps.onStartOver).toHaveBeenCalled();
  });

  it('shows Start Over button when Pokemon are revealed', () => {
    const gameState = createMockGameState({ 
      revealedPokemon: [{ id: 25, name: 'pikachu', sprite: '/sprites/pikachu.png', types: ['Electric'] }]
    });
    render(<GameControls {...defaultProps} gameState={gameState} />);
    
    expect(screen.getByText('Start Over')).toBeInTheDocument();
  });

  it('shows Give Up button when not all Pokemon are caught and none are revealed', () => {
    const gameState = createMockGameState({ 
      caughtPokemon: [{ name: 'pikachu', sprite: '/sprites/pikachu.png', types: ['Electric'] }], 
      revealedPokemon: [],
      totalPokemon: 2 
    });
    render(<GameControls {...defaultProps} gameState={gameState} />);
    
    const giveUpButton = screen.getByText('Give Up');
    expect(giveUpButton).toBeInTheDocument();
    
    fireEvent.click(giveUpButton);
    expect(defaultProps.onGiveUp).toHaveBeenCalled();
  });

  it('disables Give Up button when isGivingUp is true', () => {
    const gameState = createMockGameState({ 
      caughtPokemon: [{ name: 'pikachu', sprite: '/sprites/pikachu.png', types: ['Electric'] }],
      totalPokemon: 2,
      isGivingUp: true 
    });
    render(<GameControls {...defaultProps} gameState={gameState} />);
    
    const giveUpButton = screen.getByText('Loading...');
    expect(giveUpButton).toBeDisabled();
  });

  it('toggles mute state when mute button is clicked', () => {
    const gameState = createMockGameState();
    const { rerender } = render(<GameControls {...defaultProps} gameState={gameState} />);
    
    const muteButton = screen.getByTitle('Mute Pokemon cries');
    expect(muteButton).toHaveTextContent('🔊');
    
    fireEvent.click(muteButton);
    expect(gameState.setIsMuted).toHaveBeenCalledWith(true);

    // Simulate the state change
    const mutedGameState = createMockGameState({ isMuted: true });
    rerender(<GameControls {...defaultProps} gameState={mutedGameState} />);
    
    expect(screen.getByTitle('Unmute Pokemon cries')).toHaveTextContent('🔇');
  });
});