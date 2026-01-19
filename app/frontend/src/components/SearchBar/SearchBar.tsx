import React, { useState } from 'react'
import { Search, SlidersHorizontal, ChevronDown } from 'lucide-react'
import './SearchBar.css'

interface SearchBarProps {
  onSearch: (query: string) => void
  onFilterChange: (filters: any) => void
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, onFilterChange }) => {
  const [query, setQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    type: '',
    city: '',
    certified: false,
  })

  const handleSearch = (value: string) => {
    setQuery(value)
    // Debounce would go here in production
    onSearch(value)
  }

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  return (
    <div className="search-bar-container">
      <div className="search-bar">
        <div className="search-input-wrapper">
          <Search className="search-icon" size={20} />
          <input
            type="text"
            placeholder="Buscar por produtor, produto ou localização..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            className="search-input"
          />
        </div>

        <button 
          className="filter-button"
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal size={18} />
          Filtros
        </button>

        <select className="sort-select">
          <option value="">Ordenar por</option>
          <option value="distance">Mais próximo</option>
          <option value="name">Nome A-Z</option>
          <option value="rating">Melhor avaliado</option>
        </select>
      </div>

      {showFilters && (
        <div className="filters-panel">
          <div className="filter-group">
            <label>Tipo</label>
            <select 
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
            >
              <option value="">Todos</option>
              <option value="FAIR">Feira</option>
              <option value="STORE">Loja</option>
              <option value="FARM">Propriedade</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Cidade</label>
            <input
              type="text"
              placeholder="Digite a cidade"
              value={filters.city}
              onChange={(e) => handleFilterChange('city', e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={filters.certified}
                onChange={(e) => handleFilterChange('certified', e.target.checked)}
              />
              <span>Apenas certificados</span>
            </label>
          </div>
        </div>
      )}
    </div>
  )
}

export default SearchBar
