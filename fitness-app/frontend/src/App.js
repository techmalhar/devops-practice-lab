import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = 'http://192.168.1.37:8000';

function App() {
  const [foodItems, setFoodItems] = useState([{ name: '', quantity: 100, unit: 'g' }]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeInput, setActiveInput] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [recentFoods, setRecentFoods] = useState([]);

  // Load recent foods from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('recentFoods');
    if (saved) {
      setRecentFoods(JSON.parse(saved));
    }
    // Check system preference for dark mode
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setDarkMode(true);
      document.body.classList.add('dark-mode');
    }
  }, []);

  // Save recent foods
  const addToRecent = (foodName) => {
    const updated = [foodName, ...recentFoods.filter(f => f !== foodName)].slice(0, 5);
    setRecentFoods(updated);
    localStorage.setItem('recentFoods', JSON.stringify(updated));
  };

  // Search suggestions
  const searchFood = async (query, index) => {
    if (query.length > 2) {
      try {
        const response = await axios.get(`${API_URL}/search/${query}`);
        if (response.data.results) {
          setSearchSuggestions(response.data.results);
          setShowSuggestions(true);
          setActiveInput(index);
        }
      } catch (err) {
        console.log('Search error:', err);
      }
    } else {
      setShowSuggestions(false);
    }
  };

  const addFoodItem = () => {
    setFoodItems([...foodItems, { name: '', quantity: 100, unit: 'g' }]);
  };

  const removeFoodItem = (index) => {
    const newItems = foodItems.filter((_, i) => i !== index);
    setFoodItems(newItems);
    if (newItems.length === 0) {
      setResult(null);
    }
  };

  const updateFoodItem = (index, field, value) => {
    const newItems = [...foodItems];
    newItems[index][field] = value;
    setFoodItems(newItems);
    
    if (field === 'name' && value.length > 2) {
      searchFood(value, index);
    } else {
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (index, suggestion) => {
    const newItems = [...foodItems];
    newItems[index].name = suggestion.name;
    setFoodItems(newItems);
    setShowSuggestions(false);
  };

  const calculateNutrition = async () => {
    setLoading(true);
    setError(null);
    
    const validItems = foodItems.filter(item => item.name.trim() !== '');
    
    if (validItems.length === 0) {
      setError('Please add at least one food item');
      setLoading(false);
      return;
    }
    
    try {
      const response = await axios.post(`${API_URL}/calculate`, {
        items: validItems.map(item => ({
          name: item.name,
          quantity: item.quantity
        }))
      });
      setResult(response.data);
      
      // Add to recent foods
      validItems.forEach(item => {
        addToRecent(item.name);
      });
      
    } catch (err) {
      setError(err.response?.data?.detail || 'Backend not running. Make sure backend is started on port 8000');
    } finally {
      setLoading(false);
    }
  };

  const clearAll = () => {
    if (window.confirm('Clear all food items?')) {
      setFoodItems([{ name: '', quantity: 100, unit: 'g' }]);
      setResult(null);
      setError(null);
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.body.classList.toggle('dark-mode');
  };

  const getEmojiForFood = (foodName) => {
    const emojis = {
      'paneer': '🧀', 'banana': '🍌', 'apple': '🍎', 'rice': '🍚',
      'bread': '🍞', 'milk': '🥛', 'egg': '🥚', 'chicken': '🍗',
      'fish': '🐟', 'pizza': '🍕', 'burger': '🍔', 'salad': '🥗'
    };
    for (let key in emojis) {
      if (foodName.toLowerCase().includes(key)) {
        return emojis[key];
      }
    }
    return '🍽️';
  };

  const getTotalCalories = () => {
    if (!result) return 0;
    return Math.round(result.total.calories);
  };

  const getCalorieStatus = () => {
    const calories = getTotalCalories();
    if (calories === 0) return '';
    if (calories < 500) return { text: 'Light Meal', color: '#10b981', icon: '🥗' };
    if (calories < 800) return { text: 'Moderate Meal', color: '#f59e0b', icon: '🍱' };
    return { text: 'Heavy Meal', color: '#ef4444', icon: '🍲' };
  };

  const status = getCalorieStatus();

  return (
    <div className={`app-container ${darkMode ? 'dark' : ''}`}>
      {/* Dark Mode Toggle */}
      <button onClick={toggleDarkMode} className="dark-mode-toggle">
        {darkMode ? '☀️' : '🌙'}
      </button>

      <div className="header">
        <div className="logo">🏋️‍♂️</div>
        <h1>Fitness Tracker</h1>
        <p>Track your nutrition with AI-powered food analysis</p>
      </div>

      <div className="main-card">
        <div className="card-header">
          <h2>
            <span>📝</span> What did you eat today?
          </h2>
          {foodItems.length > 1 && (
            <button onClick={clearAll} className="clear-btn">
              🗑️ Clear All
            </button>
          )}
        </div>

        {/* Recent Foods */}
        {recentFoods.length > 0 && (
          <div className="recent-foods">
            <span className="recent-label">Recent:</span>
            {recentFoods.map((food, idx) => (
              <button
                key={idx}
                className="recent-item"
                onClick={() => {
                  setFoodItems([...foodItems, { name: food, quantity: 100, unit: 'g' }]);
                }}
              >
                {getEmojiForFood(food)} {food}
              </button>
            ))}
          </div>
        )}

        {/* Food Items */}
        <div className="food-items-container">
          {foodItems.map((item, index) => (
            <div key={index} className="food-item-wrapper">
              <div className="food-item">
                <div className="food-emoji">{getEmojiForFood(item.name) || '🍽️'}</div>
                <input
                  type="text"
                  placeholder="Food name (e.g., Paneer, Banana, Oats)"
                  value={item.name}
                  onChange={(e) => updateFoodItem(index, 'name', e.target.value)}
                  className="food-input"
                  onFocus={() => setActiveInput(index)}
                />
                <input
                  type="number"
                  placeholder="Qty"
                  value={item.quantity}
                  onChange={(e) => updateFoodItem(index, 'quantity', parseInt(e.target.value) || 0)}
                  className="quantity-input"
                />
                <select
                  value={item.unit}
                  onChange={(e) => updateFoodItem(index, 'unit', e.target.value)}
                  className="unit-select"
                >
                  <option value="g">g</option>
                  <option value="ml">ml</option>
                  <option value="piece">piece</option>
                </select>
                {foodItems.length > 1 && (
                  <button onClick={() => removeFoodItem(index)} className="remove-btn" title="Remove">
                    ✖
                  </button>
                )}
              </div>
              
              {/* Suggestions Dropdown */}
              {showSuggestions && activeInput === index && searchSuggestions.length > 0 && (
                <div className="suggestions-dropdown">
                  {searchSuggestions.slice(0, 5).map((sugg, idx) => (
                    <div
                      key={idx}
                      className="suggestion-item"
                      onClick={() => selectSuggestion(index, sugg)}
                    >
                      <span>{getEmojiForFood(sugg.name)}</span>
                      <span className="suggestion-name">{sugg.name}</span>
                      {sugg.brand && <span className="suggestion-brand">{sugg.brand}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <button onClick={addFoodItem} className="add-btn">
          ➕ Add More Food
        </button>

        <button
          onClick={calculateNutrition}
          disabled={loading}
          className="calculate-btn"
        >
          {loading ? (
            <>
              <span className="spinner"></span>
              Calculating...
            </>
          ) : (
            'Calculate Nutrition 🧮'
          )}
        </button>

        {error && (
          <div className="error">
            <span>⚠️</span> {error}
          </div>
        )}

        {result && (
          <div className="results">
            <div className="results-header">
              <h3>📊 Nutrition Summary</h3>
              {status && (
                <div className="meal-status" style={{ backgroundColor: status.color }}>
                  <span>{status.icon}</span> {status.text}
                </div>
              )}
            </div>
            
            <div className="nutrition-grid">
              <div className="nutrition-card calories">
                <div className="label">🔥 Total Calories</div>
                <div className="value">{Math.round(result.total.calories)}</div>
                <div className="unit">kcal</div>
              </div>
              <div className="nutrition-card protein">
                <div className="label">💪 Protein</div>
                <div className="value">{Math.round(result.total.protein)}</div>
                <div className="unit">grams</div>
              </div>
              <div className="nutrition-card carbs">
                <div className="label">🍚 Carbs</div>
                <div className="value">{Math.round(result.total.carbs)}</div>
                <div className="unit">grams</div>
              </div>
              <div className="nutrition-card fat">
                <div className="label">🥑 Fat</div>
                <div className="value">{Math.round(result.total.fat)}</div>
                <div className="unit">grams</div>
              </div>
            </div>

            {/* Calorie Progress Bar */}
            <div className="calorie-progress">
              <div className="progress-label">
                <span>Daily Goal Progress</span>
                <span>{Math.min(100, Math.round((result.total.calories / 2000) * 100))}%</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${Math.min(100, (result.total.calories / 2000) * 100)}%` }}
                ></div>
              </div>
            </div>

            <div className="items-breakdown">
              <h4>
                <span>📋</span> Detailed Breakdown
                <span className="item-count">({result.items.length} items)</span>
              </h4>
              {result.items.map((item, idx) => (
                <div key={idx} className="breakdown-item">
                  <div className="breakdown-left">
                    <span className="breakdown-emoji">{getEmojiForFood(item.name)}</span>
                    <span className="food-name">{item.name}</span>
                    <span className="food-quantity">{Math.round(item.quantity)}g</span>
                  </div>
                  <div className="nutrition-details">
                    <span className="cal-detail">{Math.round(item.calories)} cal</span>
                    <span className="macro">P: {Math.round(item.protein)}g</span>
                    <span className="macro">C: {Math.round(item.carbs)}g</span>
                    <span className="macro">F: {Math.round(item.fat)}g</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
