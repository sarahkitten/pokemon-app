import { useState, useRef, useEffect } from 'react'
import './App.css'
import PokemonConfetti from './PokemonConfetti'
import { POKEMON_DATA } from './data/pokemonData'
import { handleNidoranInput } from './utils/pokemonUtils'
import { PokemonData, CaughtPokemon } from './types'

interface Generation {
  name: string;
  startId: number;
  endId: number;
  total: number;
}

interface Pokemon {
  name: string;
  sprite: string;
  types: string[];
  id: number;
}

const POKEMON_TYPES = [
  "All Types", "Normal", "Fire", "Water", "Electric", "Grass", "Ice", 
  "Fighting", "Poison", "Ground", "Flying", "Psychic", "Bug", 
  "Rock", "Ghost", "Dragon", "Dark", "Steel", "Fairy"
];

const GENERATIONS: Generation[] = [
  { name: "All Generations", startId: 1, endId: 1008, total: 1008 },
  { name: "Gen 1 (Kanto)", startId: 1, endId: 151, total: 151 },
  { name: "Gen 2 (Johto)", startId: 152, endId: 251, total: 100 },
  { name: "Gen 3 (Hoenn)", startId: 252, endId: 386, total: 135 },
  { name: "Gen 4 (Sinnoh)", startId: 387, endId: 493, total: 107 },
  { name: "Gen 5 (Unova)", startId: 494, endId: 649, total: 156 },
  { name: "Gen 6 (Kalos)", startId: 650, endId: 721, total: 72 },
  { name: "Gen 7 (Alola)", startId: 722, endId: 809, total: 88 },
  { name: "Gen 8 (Galar)", startId: 810, endId: 905, total: 96 },
  { name: "Gen 9 (Paldea)", startId: 906, endId: 1008, total: 103 },
];

function App() {
  const [caughtPokemon, setCaughtPokemon] = useState<CaughtPokemon[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTotalLoading, setIsTotalLoading] = useState(false);
  const [confettiProps, setConfettiProps] = useState<{ sprite: string; position: { x: number; y: number } } | null>(null);
  const [selectedGenerationIndex, setSelectedGenerationIndex] = useState<number>(1);
  const selectedGeneration = GENERATIONS[selectedGenerationIndex];
  const [selectedType, setSelectedType] = useState<string>(POKEMON_TYPES[0]);
  const [totalPokemon, setTotalPokemon] = useState<number>(GENERATIONS[1].total);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isGivingUp, setIsGivingUp] = useState(false);
  const [remainingPokemon, setRemainingPokemon] = useState<Pokemon[]>([]);
  const [pokemonData, setPokemonData] = useState<PokemonData[]>([]);
  const [isFetchingData, setIsFetchingData] = useState(false);
  const [spriteCache, setSpriteCache] = useState<Record<string, string>>({});
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    updateTotalCount(selectedGeneration, selectedType);
  }, []);

  const resetProgress = () => {
    setCaughtPokemon([]);
    setInputValue('');
    setError('');
    setRemainingPokemon([]);
  };

  const handleGenerationChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newIndex = parseInt(event.target.value);
    const newGen = GENERATIONS[newIndex];
    if (caughtPokemon.length > 0) {
      const confirmChange = window.confirm(
        "Changing generations will reset your current progress. Are you sure?"
      );
      if (!confirmChange) return;
    }
    
    setSelectedGenerationIndex(newIndex);
    resetProgress();
    await updateTotalCount(newGen, selectedType);
  };

  const handleTypeChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = event.target.value;
    if (caughtPokemon.length > 0) {
      const confirmChange = window.confirm(
        "Changing types will reset your current progress. Are you sure?"
      );
      if (!confirmChange) return;
    }
    
    setSelectedType(newType);
    resetProgress();
    await updateTotalCount(selectedGeneration, newType);
  };

  const updateTotalCount = async (generation: Generation, type: string) => {
    console.log('Updating total count for:', generation.name, type);
    
    setIsTotalLoading(true);
    setIsFetchingData(true);
    
    try {
      const pokemonList: PokemonData[] = [];
      let typeCount = 0;

      // Filter Pokemon based on generation and type using local data
      const filteredPokemon = POKEMON_DATA.filter(pokemon => {
        const inGeneration = generation.name === "All Generations" || 
          (pokemon.id >= generation.startId && pokemon.id <= generation.endId);
        const matchesType = type === "All Types" || 
          pokemon.types.some(t => t.toLowerCase() === type.toLowerCase());
        return inGeneration && matchesType;
      });

      // Fetch sprites for the filtered Pokemon
      for (const pokemon of filteredPokemon) {
        try {
          const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemon.id}`);
          if (response.ok) {
            const data = await response.json();
            pokemonList.push({
              name: pokemon.name,
              id: pokemon.id,
              types: pokemon.types,
              spriteUrl: data.sprites.front_default,
              forms: pokemon.forms,
              generation: pokemon.generation
            });
            typeCount++;
          }
        } catch (err) {
          console.error('Error fetching Pokemon sprite:', err);
        }
      }
      
      console.log('Fetched Pokemon list:', pokemonList);
      setTotalPokemon(typeCount);
      setPokemonData(pokemonList);
    } catch (err) {
      console.error('Error updating Pokemon data:', err);
    } finally {
      setIsTotalLoading(false);
      setIsFetchingData(false);
    }
  };

  const handleStartOver = () => {
    if (caughtPokemon.length === 0) return;
    
    const confirmReset = window.confirm(
      `Are you sure you want to release all ${caughtPokemon.length} Pokemon and start over?`
    );
    
    if (confirmReset) {
      resetProgress();
    }
  };

  const fetchPokemonForms = async (baseName: string) => {
    try {
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${baseName}`);
      if (!response.ok) return null;
      const speciesData = await response.json();
      const forms = speciesData.varieties.map((variety: any) => ({
        name: variety.pokemon.name,
        isDefault: variety.is_default
      }));
      return forms;
    } catch (err) {
      console.error('Error fetching Pokemon forms:', err);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const pokemonName = inputValue.trim().toLowerCase().replace(/\s+/g, '-');
    
    // Special case for Nidoran
    if (pokemonName === 'nidoran') {
      setIsLoading(true);
      setError('');
      
      const result = await handleNidoranInput(pokemonData, caughtPokemon, spriteCache, isMuted);
      
      if (!result.success) {
        setError(result.error || 'Error catching Nidoran!');
        setTimeout(() => inputRef.current?.focus(), 10);
        setIsLoading(false);
        return;
      }

      if (result.caughtPokemon) {
        // Update sprite cache with new sprites
        result.caughtPokemon.forEach(pokemon => {
          if (pokemon.sprite) {
            setSpriteCache(prev => ({ ...prev, [pokemon.name]: pokemon.sprite }));
          }
        });

        setCaughtPokemon(prev => [...result.caughtPokemon!, ...prev]);
        setInputValue('');
        setError('');
        
        // Play cry if not muted
        if (!isMuted && result.cryId) {
          try {
            const cryUrl = `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${result.cryId}.ogg`;
            const audio = new Audio(cryUrl);
            audio.play().catch(err => console.log('Error playing cry:', err));
          } catch (err) {
            console.log('Error playing cry:', err);
          }
        }
        
        // Get position for confetti
        const rect = inputRef.current?.getBoundingClientRect();
        if (rect && result.sprite) {
          const centerX = rect.left + (rect.width / 2);
          const centerY = rect.top + (rect.height / 2);
          
          setConfettiProps({
            sprite: result.sprite,
            position: {
              x: centerX + window.scrollX,
              y: centerY + window.scrollY
            }
          });
          
          setTimeout(() => inputRef.current?.focus(), 10);
          setTimeout(() => setConfettiProps(null), 2000);
        }
      }
      
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Find the Pokemon in our pre-fetched data
      const pokemon = pokemonData.find(p => 
        p.name.toLowerCase() === pokemonName.toLowerCase() ||  // Match base name
        p.forms.some(f => f.name.toLowerCase() === pokemonName.toLowerCase())  // Match specific form
      );
      
      if (!pokemon) {
        setError('That\'s not a valid Pokemon name!');
        setTimeout(() => inputRef.current?.focus(), 10);
        return;
      }

      // Check if any form of this Pokemon is already caught
      const existingPokemon = caughtPokemon.find(p => {
        const pokemonInData = pokemonData.find(pd => 
          pd.forms.some(f => f.name.toLowerCase() === p.name.toLowerCase())
        );
        return pokemonInData?.name === pokemon.name;
      });

      if (existingPokemon) {
        setError(`You already caught a different form of ${pokemon.name}!`);
        setTimeout(() => inputRef.current?.focus(), 10);
        return;
      }

      // Determine which form to use
      let form;
      if (pokemonName.includes('-')) {
        // If input includes a form, try to find that specific form
        form = pokemon.forms.find(f => f.name.toLowerCase() === pokemonName.toLowerCase());
      }
      
      // If no specific form found or no form specified, use the default form
      if (!form) {
        form = pokemon.forms.find(f => f.isDefault);
      }

      if (!form) {
        setError('Could not find a valid form for this Pokemon!');
        setTimeout(() => inputRef.current?.focus(), 10);
        return;
      }

      // Check if we have the sprite cached
      let sprite = spriteCache[form.name];
      if (!sprite) {
        // Fetch the sprite if not cached
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${form.name}`);
        if (response.ok) {
          const data = await response.json();
          sprite = data.sprites.front_default;
          setSpriteCache(prev => ({ ...prev, [form.name]: sprite }));
        }
      }

      // Fetch and play the Pokemon's cry if not muted
      if (!isMuted) {
        try {
          const cryUrl = `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${pokemon.id}.ogg`;
          const audio = new Audio(cryUrl);
          audio.play().catch(err => console.log('Error playing cry:', err));
        } catch (err) {
          console.log('Error fetching cry:', err);
        }
      }

      const newCaughtPokemon: CaughtPokemon = {
        name: form.name,
        sprite: sprite || '',
        types: pokemon.types
      };

      setCaughtPokemon(prev => [newCaughtPokemon, ...prev]);
      setInputValue('');
      setError('');
      
      // Get position for confetti
      const rect = inputRef.current?.getBoundingClientRect();
      if (rect) {
        const centerX = rect.left + (rect.width / 2);
        const centerY = rect.top + (rect.height / 2);
        
        setConfettiProps({
          sprite: newCaughtPokemon.sprite,
          position: {
            x: centerX + window.scrollX,
            y: centerY + window.scrollY
          }
        });
        
        setTimeout(() => inputRef.current?.focus(), 10);
        setTimeout(() => setConfettiProps(null), 2000);
      }
    } catch (err) {
      setError('That\'s not a valid Pokemon name!');
      setTimeout(() => inputRef.current?.focus(), 10);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGiveUp = async () => {
    if (caughtPokemon.length === totalPokemon) {
      return; // No need to give up if all Pokemon are caught
    }

    const confirmGiveUp = window.confirm(
      `Are you sure you want to give up? This will reveal all remaining Pokemon!`
    );
    
    if (!confirmGiveUp) return;

    setIsGivingUp(true);
    const remaining: Pokemon[] = [];
    
    try {
      for (let id = selectedGeneration.startId; id <= selectedGeneration.endId; id++) {
        // Skip if already caught
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
        if (response.ok) {
          const data = await response.json();
          const types = data.types.map((t: any) => t.type.name);
          
          // Skip if this Pokemon is already caught
          if (caughtPokemon.some(p => p.name === data.name)) {
            continue;
          }
          
          // Check if Pokemon matches selected type
          if (selectedType === "All Types" || types.includes(selectedType.toLowerCase())) {
            remaining.push({
              id: data.id,
              name: data.name,
              sprite: data.sprites.front_default,
              types
            });
          }
        }
      }
      setRemainingPokemon(remaining);
    } catch (err) {
      console.error('Error fetching remaining Pokemon:', err);
    } finally {
      setIsGivingUp(false);
    }
  };

  const playPokemonCry = async (pokemonId: number) => {
    if (isMuted) return;
    
    try {
      const cryUrl = `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${pokemonId}.ogg`;
      const audio = new Audio(cryUrl);
      audio.play().catch(err => console.log('Error playing cry:', err));
    } catch (err) {
      console.log('Error playing cry:', err);
    }
  };

  const handlePokemonClick = async (pokemon: CaughtPokemon | Pokemon) => {
    // Find the Pokemon in our data to get its ID
    const pokemonData = POKEMON_DATA.find(p => 
      p.name.toLowerCase() === pokemon.name.toLowerCase() || 
      p.forms.some(f => f.name.toLowerCase() === pokemon.name.toLowerCase())
    );
    
    if (pokemonData) {
      await playPokemonCry(pokemonData.id);
    }
  };

  return (
    <div className="app">
      <div className="main-content">
        <h1>Catch them all!</h1>
        
        <div className="pokemon-section">
          <h2>How many Pokemon can you catch?</h2>
          
          <form onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={isFetchingData ? "Loading Pokemon data..." : remainingPokemon.length > 0 ? "Click 'Start Over' to catch more Pokemon" : "Enter a Pokemon name"}
              disabled={isLoading || remainingPokemon.length > 0 || isFetchingData}
            />
          </form>

          <div className="message-container">
            {error && <p className="error">{error}</p>}
            {isLoading && <p className="loading">Searching for Pokemon...</p>}
            {isFetchingData && <p className="loading">Loading Pokemon data...</p>}
            {remainingPokemon.length > 0 && (
              <p className="info">Click 'Start Over' to try catching Pokemon again!</p>
            )}
          </div>
          
          <div className="controls">
            <p className={`counter ${caughtPokemon.length === totalPokemon ? 'success' : ''}`}>
              {isTotalLoading ? (
                <span className="loading-dots">
                  <span>.</span><span>.</span><span>.</span>
                </span>
              ) : caughtPokemon.length === totalPokemon ? (
                `Congratulations! You've caught all ${totalPokemon} Pokemon!`
              ) : (
                `You've caught ${caughtPokemon.length} Pokemon! ${totalPokemon - caughtPokemon.length} to go!`
              )}
            </p>
            <div className="button-group">
              {caughtPokemon.length > 0 && (
                <button onClick={handleStartOver} className="start-over-button">
                  Start Over
                </button>
              )}
              {remainingPokemon.length === 0 && caughtPokemon.length < totalPokemon && (
                <button
                  className="give-up-button"
                  onClick={handleGiveUp}
                  disabled={caughtPokemon.length === 0 || isGivingUp}
                >
                  {isGivingUp ? "Loading..." : "Give Up"}
                </button>
              )}
              <button
                className={`mute-button ${isMuted ? 'muted' : ''}`}
                onClick={() => setIsMuted(!isMuted)}
                title={isMuted ? "Unmute Pokemon cries" : "Mute Pokemon cries"}
              >
                {isMuted ? "🔇" : "🔊"}
              </button>
            </div>
          </div>

          {(caughtPokemon.length > 0 || remainingPokemon.length > 0) && (
            <div className={`caught-list ${caughtPokemon.length === totalPokemon ? 'success' : ''}`}>
              <h3>Pokemon Collection:</h3>
              <div className="pokemon-list">
                {caughtPokemon.map((pokemon) => (
                  <div 
                    key={pokemon.name} 
                    className="pokemon-card"
                    onClick={() => handlePokemonClick(pokemon)}
                  >
                    <img src={pokemon.sprite} alt={pokemon.name} className="pokemon-sprite" />
                    <span>{pokemon.name}</span>
                    <div className="pokemon-types">
                      {pokemon.types.map(type => (
                        <span key={type} className={`type-tag ${type}`}>{type}</span>
                      ))}
                    </div>
                  </div>
                ))}
                {remainingPokemon.map((pokemon) => (
                  <div 
                    key={pokemon.name} 
                    className="pokemon-card uncaught"
                    onClick={() => handlePokemonClick(pokemon)}
                  >
                    <img src={pokemon.sprite} alt={pokemon.name} className="pokemon-sprite" />
                    <span>{pokemon.name}</span>
                    <div className="pokemon-types">
                      {pokemon.types.map(type => (
                        <span key={type} className={`type-tag ${type}`}>{type}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="sidebar">
        <div className="filters">
          <div className="generation-selector">
            <label htmlFor="generation">Choose your region:</label>
            <select 
              id="generation" 
              onChange={handleGenerationChange}
              value={selectedGenerationIndex}
            >
              {GENERATIONS.map((gen, index) => (
                <option key={gen.name} value={index}>
                  {gen.name} ({gen.total} Pokemon)
                </option>
              ))}
            </select>
          </div>

          <div className="type-selector">
            <label htmlFor="type">Choose Pokemon type:</label>
            <select 
              id="type" 
              onChange={handleTypeChange}
              value={selectedType}
            >
              {POKEMON_TYPES.map(type => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {confettiProps && (
        <PokemonConfetti
          spriteUrl={confettiProps.sprite}
          inputPosition={confettiProps.position}
        />
      )}
    </div>
  );
}

export default App;