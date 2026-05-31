import React, { useState } from 'react'
import { Search, SlidersHorizontal } from 'lucide-react'
import './SearchBar.css'

interface SearchBarProps {
  onSearch: (query: string) => void
  onFilterChange: (filters: any) => void
  onSortChange: (sort: string) => void
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, onFilterChange, onSortChange }) => {
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('')
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

  const handleSortChange = (value: string) => {
    setSort(value)
    onSortChange(value)
  }

  return (
    <div className="search-bar-container">
      <div className="search-bar">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
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

        <select
          className="sort-select"
          value={sort}
          onChange={(e) => handleSortChange(e.target.value)}
        >
          <option value="">Ordenar por</option>
          <option value="name">Nome A-Z</option>
          <option value="rating">Melhor avaliadas</option>
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
              <option value="FARM">Fazenda/Sítio</option>
              <option value="DELIVERY">Apenas Delivery</option>
              <option value="OTHER">Outro</option>
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
