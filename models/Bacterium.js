const mongoose = require('mongoose');

const bacteriumSchema = new mongoose.Schema({
  playerId: { type: String, required: true },
  speciesName: { type: String, default: 'Bacterium staterus' },
  generation: { type: Number, default: 1 },

  // Nowa właściwość: Przechowuje dokładny stan roju przy wylogowaniu!
  savedCells: {
    type: [{ x: Number, y: Number, atp: Number }],
    default: []
  },

  // --- NOWE: Zdobyte geny i oporności ---
  traits: {
    type: [String],
    default: [] // Np. ['penicillin_res']
  },

  morphology: {
    shape: { type: String, enum: ['bacillus', 'coccus', 'spirillum'], default: 'bacillus' },
    gramStain: { type: String, enum: ['positive', 'negative'], default: 'negative' }
  },

  metabolism: {
    oxygenRequirement: { type: String, enum: ['aerobe', 'anaerobe', 'facultative'], default: 'facultative' },
    atpEfficiency: { type: Number, default: 2 }
  },

  status: {
    currentATP: { type: Number, default: 150 }, // Używane tylko na starcie
    isAlive: { type: Boolean, default: true }
  }
}, { timestamps: true });

module.exports = mongoose.model('Bacterium', bacteriumSchema);