'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  Download, 
  Plus, 
  Trash2, 
  Check, 
  Sparkles, 
  Bell, 
  Settings, 
  ArrowLeft, 
  ArrowRight, 
  Filter, 
  Info, 
  User, 
  Percent, 
  Briefcase, 
  CreditCard, 
  Lightbulb, 
  Droplet, 
  Bolt, 
  ChevronRight, 
  ExternalLink,
  Pencil,
  GripVertical,
  Star
} from 'lucide-react';

// --- DATA STRUCTURES ---

interface Investment {
  id: string;
  name: string;
  saldo: number;
  aporte: number;
  variation: number; // e.g. 1.2 or -2.4
  institution: string;
  notes: string;
}

interface Expense {
  id: string;
  category: string;
  value: number;
  installments: string; // e.g. "1/1", "1/10"
  notes: string;
  isRecurring?: boolean;
  parentId?: string;
}

function generateId(prefix: string): string {
  return prefix + '-' + Math.random().toString(36).substring(2, 10);
}

interface PersonalExpense {
  id: string;
  description: string;
  value: number;
  installments?: string;
  notes: string;
  parentId?: string;
}

interface PersonData {
  name: string;
  budgetLimit: number;
  personalExpenses: PersonalExpense[];
}

interface MonthlyData {
  monthYear: string;
  lastUpdated: string;
  investments: Investment[];
  expenses: Expense[];
  people: {
    ludmila: PersonData;
    leine: PersonData;
  };
  splitRatioLudmila?: number;
}

interface HistoryMonth {
  id: string;
  monthYear: string;
  totalExpenses: number;
  totalInvestments: number;
  isCurrent: boolean;
}

// --- MOCK INITIAL DATA ---

const INITIAL_ACTIVE_MONTH: MonthlyData = {
  monthYear: "Julho 2025",
  lastUpdated: "16 de Julho às 16:55",
  investments: [
    {
      id: "inv-1",
      name: "Porquinho",
      saldo: 1250,
      aporte: 200,
      variation: 1.2,
      institution: "Nubank",
      notes: "Reserva imediata"
    },
    {
      id: "inv-2",
      name: "Tesouro Selic",
      saldo: 5400,
      aporte: 500,
      variation: 0.9,
      institution: "XP Investimentos",
      notes: "Longo prazo"
    },
    {
      id: "inv-3",
      name: "Bitcoin",
      saldo: 2100,
      aporte: 100,
      variation: -2.4,
      institution: "Binance",
      notes: "Volatilidade"
    }
  ],
  expenses: [
    {
      id: "exp-1",
      category: "Aluguel",
      value: 2500,
      installments: "1/1",
      notes: "Vence dia 10"
    },
    {
      id: "exp-2",
      category: "Eletricidade",
      value: 180,
      installments: "1/1",
      notes: "Cemig"
    },
    {
      id: "exp-3",
      category: "Internet",
      value: 120,
      installments: "1/1",
      notes: "Fibra Ótica"
    },
    {
      id: "exp-4",
      category: "Cartão de Crédito",
      value: 1000,
      installments: "1/10",
      notes: "Banco Caixa"
    }
  ],
  people: {
    ludmila: {
      name: "Ludmilla",
      budgetLimit: 1400,
      personalExpenses: [
        { id: "pe-l1", description: "Salão de Beleza", value: 150, installments: "1/1", notes: "Cabelo" },
        { id: "pe-l2", description: "Curso de Inglês", value: 350, installments: "1/1", notes: "Mensalidade" }
      ]
    },
    leine: {
      name: "Leinimer",
      budgetLimit: 1400,
      personalExpenses: [
        { id: "pe-le1", description: "Academia", value: 120, installments: "1/1", notes: "Mensal" },
        { id: "pe-le2", description: "Livros", value: 80, installments: "1/1", notes: "Amazon" }
      ]
    }
  }
};

const INITIAL_HISTORY: HistoryMonth[] = [
  {
    id: "hist-1",
    monthYear: "Julho 2025",
    totalExpenses: 3800,
    totalInvestments: 8750,
    isCurrent: true
  },
  {
    id: "hist-2",
    monthYear: "Junho 2025",
    totalExpenses: 4120,
    totalInvestments: 8100,
    isCurrent: false
  },
  {
    id: "hist-3",
    monthYear: "Maio 2025",
    totalExpenses: 3950,
    totalInvestments: 7600,
    isCurrent: false
  }
];

export default function Home() {
  // --- STATE ---
  const [activeTab, setActiveTab] = useState<'analyses' | 'dashboard' | 'history' | 'settings'>('analyses');
  const [activeMonthData, setActiveMonthData] = useState<MonthlyData>(() => {
    if (typeof window !== 'undefined') {
      const savedActiveData = localStorage.getItem('finflow_active_month');
      if (savedActiveData) {
        try {
          const parsed = JSON.parse(savedActiveData);
          if (parsed && parsed.people) {
            if (parsed.people.leine && (parsed.people.leine.name === 'Leine' || parsed.people.leine.name === 'Leinimer' || !parsed.people.leine.name)) {
              parsed.people.leine.name = 'Leinimer';
            }
            if (parsed.people.ludmila && (parsed.people.ludmila.name === 'Ludmila' || parsed.people.ludmila.name === 'Ludimilla' || !parsed.people.ludmila.name)) {
              parsed.people.ludmila.name = 'Ludmilla';
            }
          }
          return parsed;
        } catch (e) {
          console.error("Error parsing saved active month", e);
        }
      }
    }
    return INITIAL_ACTIVE_MONTH;
  });

  const [historyMonths, setHistoryMonths] = useState<HistoryMonth[]>(() => {
    let history: HistoryMonth[] = INITIAL_HISTORY;
    if (typeof window !== 'undefined') {
      const savedHistory = localStorage.getItem('finflow_history');
      if (savedHistory) {
        try {
          history = JSON.parse(savedHistory);
        } catch (e) {
          console.error("Error parsing saved history", e);
        }
      }
      
      // Auto-sync missing months from finflow_months_data
      const allMonthsStr = localStorage.getItem('finflow_months_data');
      const savedActiveData = localStorage.getItem('finflow_active_month');
      let activeMonthName = "Julho 2025";
      if (savedActiveData) {
        try {
          const parsed = JSON.parse(savedActiveData);
          if (parsed && parsed.monthYear) {
            activeMonthName = parsed.monthYear;
          }
        } catch (e) {}
      }

      if (allMonthsStr) {
        try {
          const allMonths = JSON.parse(allMonthsStr);
          let updated = false;
          Object.keys(allMonths).forEach(monthKey => {
            const monthData = allMonths[monthKey];
            const exists = history.some(h => h.monthYear === monthKey);
            if (!exists) {
              const totalExp = monthData.expenses ? monthData.expenses.reduce((sum: number, item: any) => sum + item.value, 0) : 0;
              const totalInv = monthData.investments ? monthData.investments.reduce((sum: number, item: any) => sum + item.saldo, 0) : 0;
              history.push({
                id: 'hist-' + Math.random().toString(36).substring(2, 9),
                monthYear: monthKey,
                totalExpenses: totalExp,
                totalInvestments: totalInv,
                isCurrent: monthKey === activeMonthName
              });
              updated = true;
            }
          });
          
          if (updated) {
            const MONTH_ORDER = [
              "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", 
              "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
            ];
            history.sort((a, b) => {
              const [aMonth, aYear] = a.monthYear.split(' ');
              const [bMonth, bYear] = b.monthYear.split(' ');
              const yearDiff = parseInt(bYear, 10) - parseInt(aYear, 10);
              if (yearDiff !== 0) return yearDiff;
              return MONTH_ORDER.indexOf(bMonth) - MONTH_ORDER.indexOf(aMonth);
            });
            localStorage.setItem('finflow_history', JSON.stringify(history));
          }
        } catch (e) {
          console.error("Error parsing all months in history initialization", e);
        }
      }
    }
    return history;
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showNotificationCount, setShowNotificationCount] = useState(2);
  const [selectedAnalysisMonth, setSelectedAnalysisMonth] = useState<string>("Março 2024");

  // Add Item States
  const [showAddInvModal, setShowAddInvModal] = useState(false);
  const [newInv, setNewInv] = useState({ name: '', saldo: '', aporte: '', variation: '', institution: '', notes: '' });
  const [editingInv, setEditingInv] = useState<Investment | null>(null);

  const [showAddExpModal, setShowAddExpModal] = useState(false);
  const [newExp, setNewExp] = useState({ category: '', value: '', installments: '1/1', notes: '', isRecurring: false });
  const [editingExp, setEditingExp] = useState<Expense | null>(null);

  const [showAddPersonalModal, setShowAddPersonalModal] = useState<{ show: boolean, person: 'ludmila' | 'leine' }>({ show: false, person: 'ludmila' });
  const [newPersonalExp, setNewPersonalExp] = useState({ description: '', value: '', installments: '1/1', notes: '' });
  const [editingPersonalExp, setEditingPersonalExp] = useState<{ person: 'ludmila' | 'leine', expense: PersonalExpense } | null>(null);

  // Drag and drop states
  const [draggedItem, setDraggedItem] = useState<{ type: 'investment' | 'expense' | 'ludmila' | 'leine', index: number } | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Inline editing states
  const [inlineEdit, setInlineEdit] = useState<{ type: 'inv-saldo' | 'inv-aporte' | 'exp' | 'pe-leine' | 'pe-ludmila'; id: string } | null>(null);
  const [inlineValue, setInlineValue] = useState<string>('');

  const handleInlineSave = (type: 'inv-saldo' | 'inv-aporte' | 'exp' | 'pe-leine' | 'pe-ludmila', id: string, rawVal: string) => {
    const numericVal = parseFloat(rawVal.replace(',', '.')) || 0;
    const updated = { ...activeMonthData };

    if (type === 'inv-saldo') {
      updated.investments = updated.investments.map(item => {
        if (item.id === id) {
          return { ...item, saldo: numericVal };
        }
        return item;
      });
    } else if (type === 'inv-aporte') {
      updated.investments = updated.investments.map(item => {
        if (item.id === id) {
          return { ...item, aporte: numericVal };
        }
        return item;
      });
    } else if (type === 'exp') {
      updated.expenses = updated.expenses.map(item => {
        if (item.id === id) {
          return { ...item, value: numericVal };
        }
        return item;
      });
    } else if (type === 'pe-leine') {
      const nextPersonalLeine = updated.people.leine.personalExpenses.map(item => {
        if (item.id === id) {
          return { ...item, value: numericVal };
        }
        return item;
      });
      updated.people.leine.personalExpenses = nextPersonalLeine;
    } else if (type === 'pe-ludmila') {
      const nextPersonalLudmila = updated.people.ludmila.personalExpenses.map(item => {
        if (item.id === id) {
          return { ...item, value: numericVal };
        }
        return item;
      });
      updated.people.ludmila.personalExpenses = nextPersonalLudmila;
    }

    saveState(updated);
    setInlineEdit(null);
  };

  const moveItem = (type: 'investment' | 'expense' | 'ludmila' | 'leine', index: number, direction: 'up' | 'down') => {
    const updated = { ...activeMonthData };
    let list: any[] = [];
    
    if (type === 'investment') list = [...updated.investments];
    else if (type === 'expense') list = [...updated.expenses];
    else if (type === 'ludmila') list = [...updated.people.ludmila.personalExpenses];
    else if (type === 'leine') list = [...updated.people.leine.personalExpenses];
    
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;
    
    // Swap items
    const [moved] = list.splice(index, 1);
    list.splice(targetIndex, 0, moved);
    
    if (type === 'investment') updated.investments = list;
    else if (type === 'expense') updated.expenses = list;
    else if (type === 'ludmila') updated.people.ludmila.personalExpenses = list;
    else if (type === 'leine') updated.people.leine.personalExpenses = list;
    
    updated.lastUpdated = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' }) + ' às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    
    saveState(updated);
  };

  const handleDragStart = (type: 'investment' | 'expense' | 'ludmila' | 'leine', index: number) => {
    setDraggedItem({ type, index });
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (type: 'investment' | 'expense' | 'ludmila' | 'leine', targetIndex: number) => {
    if (!draggedItem || draggedItem.type !== type) {
      setDraggedItem(null);
      setDragOverIndex(null);
      return;
    }
    
    const sourceIndex = draggedItem.index;
    if (sourceIndex === targetIndex) {
      setDraggedItem(null);
      setDragOverIndex(null);
      return;
    }
    
    const updated = { ...activeMonthData };
    let list: any[] = [];
    
    if (type === 'investment') list = [...updated.investments];
    else if (type === 'expense') list = [...updated.expenses];
    else if (type === 'ludmila') list = [...updated.people.ludmila.personalExpenses];
    else if (type === 'leine') list = [...updated.people.leine.personalExpenses];
    
    const [removed] = list.splice(sourceIndex, 1);
    list.splice(targetIndex, 0, removed);
    
    if (type === 'investment') updated.investments = list;
    else if (type === 'expense') updated.expenses = list;
    else if (type === 'ludmila') updated.people.ludmila.personalExpenses = list;
    else if (type === 'leine') updated.people.leine.personalExpenses = list;
    
    updated.lastUpdated = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' }) + ' às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    
    saveState(updated);
    setDraggedItem(null);
    setDragOverIndex(null);
  };

  const historyYears = Array.from(new Set(historyMonths.map(m => {
    const parts = m.monthYear.split(' ');
    return parts[parts.length - 1];
  }))).filter(y => !isNaN(parseInt(y, 10)) && parseInt(y, 10) >= 2025)
      .sort((a, b) => parseInt(b, 10) - parseInt(a, 10));

  // Save changes helper
  const saveState = (updatedData: MonthlyData, updatedHistory?: HistoryMonth[]) => {
    if (typeof window === 'undefined') {
      setActiveMonthData(updatedData);
      return;
    }

    // 1. Ensure all expenses have parentId
    const sanitizedExpenses = updatedData.expenses.map(e => ({
      ...e,
      parentId: e.parentId || e.id
    }));

    // Ensure all personal expenses have parentId
    const sanitizedLudmilaPE = updatedData.people.ludmila.personalExpenses.map(p => ({
      ...p,
      parentId: p.parentId || p.id
    }));
    const sanitizedLeinePE = updatedData.people.leine.personalExpenses.map(p => ({
      ...p,
      parentId: p.parentId || p.id
    }));

    const sanitizedData: MonthlyData = {
      ...updatedData,
      expenses: sanitizedExpenses,
      people: {
        ...updatedData.people,
        ludmila: {
          ...updatedData.people.ludmila,
          personalExpenses: sanitizedLudmilaPE
        },
        leine: {
          ...updatedData.people.leine,
          personalExpenses: sanitizedLeinePE
        }
      }
    };

    setActiveMonthData(sanitizedData);
    localStorage.setItem('finflow_active_month', JSON.stringify(sanitizedData));

    // 2. Load existing months
    const allMonthsStr = localStorage.getItem('finflow_months_data') || '{}';
    let allMonths: Record<string, MonthlyData> = {};
    try {
      allMonths = JSON.parse(allMonthsStr);
    } catch (e) {
      console.error("Error parsing finflow_months_data", e);
    }
    allMonths[sanitizedData.monthYear] = sanitizedData;

    // 3. Determine max installment propagation steps
    let maxInstallmentSteps = 0;
    sanitizedData.expenses.forEach(exp => {
      if (exp.installments && exp.installments.includes('/')) {
        const parts = exp.installments.split('/');
        const current = parseInt(parts[0], 10);
        const total = parseInt(parts[1], 10);
        if (!isNaN(current) && !isNaN(total) && total > current) {
          const steps = total - current;
          if (steps > maxInstallmentSteps) {
            maxInstallmentSteps = steps;
          }
        }
      }
    });

    // Also personal expenses installments
    sanitizedData.people.ludmila.personalExpenses.forEach(pe => {
      if (pe.installments && pe.installments.includes('/')) {
        const parts = pe.installments.split('/');
        const current = parseInt(parts[0], 10);
        const total = parseInt(parts[1], 10);
        if (!isNaN(current) && !isNaN(total) && total > current) {
          const steps = total - current;
          if (steps > maxInstallmentSteps) {
            maxInstallmentSteps = steps;
          }
        }
      }
    });
    sanitizedData.people.leine.personalExpenses.forEach(pe => {
      if (pe.installments && pe.installments.includes('/')) {
        const parts = pe.installments.split('/');
        const current = parseInt(parts[0], 10);
        const total = parseInt(parts[1], 10);
        if (!isNaN(current) && !isNaN(total) && total > current) {
          const steps = total - current;
          if (steps > maxInstallmentSteps) {
            maxInstallmentSteps = steps;
          }
        }
      }
    });

    // 4. Generate/collect target subsequent month strings
    const targetMonths: string[] = [];
    let tempMonth = sanitizedData.monthYear;
    
    // Generate up to max installments steps
    const getNextMonthString = (monthYearStr: string): string => {
      const MONTH_ORDER = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", 
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
      ];
      const parts = monthYearStr.split(' ');
      if (parts.length < 2) return monthYearStr;
      const month = parts[0];
      const year = parseInt(parts[1], 10);
      const monthIdx = MONTH_ORDER.indexOf(month);
      if (monthIdx === -1) return monthYearStr;
      if (monthIdx === 11) {
        return `${MONTH_ORDER[0]} ${year + 1}`;
      } else {
        return `${MONTH_ORDER[monthIdx + 1]} ${year}`;
      }
    };

    for (let s = 0; s < maxInstallmentSteps; s++) {
      tempMonth = getNextMonthString(tempMonth);
      targetMonths.push(tempMonth);
    }

    const MONTH_ORDER = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", 
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    const parseMY = (str: string) => {
      const parts = str.split(' ');
      return {
        month: parts[0],
        year: parseInt(parts[1], 10),
        idx: MONTH_ORDER.indexOf(parts[0])
      };
    };
    const startP = parseMY(sanitizedData.monthYear);
    
    const existingMonths = Object.keys(allMonths).filter(m => {
      const p = parseMY(m);
      if (p.idx === -1 || isNaN(p.year)) return false;
      if (p.year > startP.year) return true;
      if (p.year === startP.year && p.idx > startP.idx) return true;
      return false;
    });

    existingMonths.forEach(m => {
      if (!targetMonths.includes(m)) {
        targetMonths.push(m);
      }
    });

    // Sort targetMonths chronologically
    targetMonths.sort((a, b) => {
      const pa = parseMY(a);
      const pb = parseMY(b);
      if (pa.year !== pb.year) return pa.year - pb.year;
      return pa.idx - pb.idx;
    });

    // We will build a nextHistory copy to modify and save at the end
    const historyToUse = updatedHistory || historyMonths;
    let nextHistory = [...historyToUse];

    // 5. Propagate month-by-month sequentially
    let prevMonthData = sanitizedData;
    for (let i = 0; i < targetMonths.length; i++) {
      const monthName = targetMonths[i];
      let nextMonthData = allMonths[monthName];
      if (!nextMonthData) {
        // Inherit investments and set up defaults
        nextMonthData = {
          monthYear: monthName,
          lastUpdated: new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' }) + ' às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          investments: prevMonthData.investments.map(inv => ({
            id: generateId('inv'),
            name: inv.name,
            saldo: inv.saldo,
            aporte: 0,
            variation: 0,
            institution: "",
            notes: ""
          })),
          expenses: [],
          splitRatioLudmila: prevMonthData.splitRatioLudmila ?? 60,
          people: {
            ludmila: {
              name: prevMonthData.people.ludmila.name || "Ludmilla",
              budgetLimit: prevMonthData.people.ludmila.budgetLimit,
              personalExpenses: []
            },
            leine: {
              name: prevMonthData.people.leine.name || "Leinimer",
              budgetLimit: prevMonthData.people.leine.budgetLimit,
              personalExpenses: []
            }
          }
        };
      }

      // Propagate expenses
      const activePropagatingParentIds = prevMonthData.expenses
        .filter(exp => exp.isRecurring || (exp.installments && exp.installments.includes('/') && parseInt(exp.installments.split('/')[0], 10) < parseInt(exp.installments.split('/')[1], 10)))
        .map(exp => exp.parentId || exp.id);

      const propagatedExpensesForNext: Expense[] = [];
      prevMonthData.expenses.forEach(exp => {
        const parentId = exp.parentId || exp.id;
        const isInstallment = exp.installments && exp.installments.includes('/');
        if (isInstallment) {
          const parts = exp.installments.trim().split('/');
          const current = parseInt(parts[0], 10);
          const total = parseInt(parts[1], 10);
          if (!isNaN(current) && !isNaN(total) && current < total) {
            propagatedExpensesForNext.push({
              id: generateId('exp'),
              category: exp.category,
              value: exp.value,
              installments: `${current + 1}/${total}`,
              notes: exp.notes,
              isRecurring: exp.isRecurring,
              parentId: parentId
            });
            return;
          }
        }

        if (exp.isRecurring) {
          propagatedExpensesForNext.push({
            id: generateId('exp'),
            category: exp.category,
            value: exp.value,
            installments: exp.installments || "1/1",
            notes: exp.notes,
            isRecurring: true,
            parentId: parentId
          });
        }
      });

      const manualExpenses = nextMonthData.expenses.filter(e => {
        if (!e.parentId) return true;
        const parentStillExists = prevMonthData.expenses.some(pe => (pe.parentId || pe.id) === e.parentId);
        if (!parentStillExists) return false;
        const isStillPropagating = activePropagatingParentIds.includes(e.parentId);
        if (!isStillPropagating) return false;
        return false;
      });

      nextMonthData.expenses = [...manualExpenses, ...propagatedExpensesForNext];

      // Propagate Ludmila PE
      const activeLudmilaPEParentIds = prevMonthData.people.ludmila.personalExpenses
        .filter(pe => pe.installments && pe.installments.includes('/') && parseInt(pe.installments.split('/')[0], 10) < parseInt(pe.installments.split('/')[1], 10))
        .map(pe => pe.parentId || pe.id);

      const propagatedLudmilaPEForNext: PersonalExpense[] = [];
      prevMonthData.people.ludmila.personalExpenses.forEach(pe => {
        if (pe.installments && pe.installments.includes('/')) {
          const parts = pe.installments.split('/');
          const current = parseInt(parts[0], 10);
          const total = parseInt(parts[1], 10);
          if (!isNaN(current) && !isNaN(total) && current < total) {
            propagatedLudmilaPEForNext.push({
              id: generateId('pe'),
              description: pe.description,
              value: pe.value,
              installments: `${current + 1}/${total}`,
              notes: pe.notes,
              parentId: pe.parentId || pe.id
            });
          }
        }
      });

      const manualLudmilaPE = nextMonthData.people.ludmila.personalExpenses.filter(e => {
        if (!e.parentId) return true;
        const parentStillExists = prevMonthData.people.ludmila.personalExpenses.some(pe => (pe.parentId || pe.id) === e.parentId);
        if (!parentStillExists) return false;
        const isStillPropagating = activeLudmilaPEParentIds.includes(e.parentId);
        if (!isStillPropagating) return false;
        return false;
      });

      nextMonthData.people.ludmila.personalExpenses = [...manualLudmilaPE, ...propagatedLudmilaPEForNext];

      // Propagate Leine PE
      const activeLeinePEParentIds = prevMonthData.people.leine.personalExpenses
        .filter(pe => pe.installments && pe.installments.includes('/') && parseInt(pe.installments.split('/')[0], 10) < parseInt(pe.installments.split('/')[1], 10))
        .map(pe => pe.parentId || pe.id);

      const propagatedLeinePEForNext: PersonalExpense[] = [];
      prevMonthData.people.leine.personalExpenses.forEach(pe => {
        if (pe.installments && pe.installments.includes('/')) {
          const parts = pe.installments.split('/');
          const current = parseInt(parts[0], 10);
          const total = parseInt(parts[1], 10);
          if (!isNaN(current) && !isNaN(total) && current < total) {
            propagatedLeinePEForNext.push({
              id: generateId('pe'),
              description: pe.description,
              value: pe.value,
              installments: `${current + 1}/${total}`,
              notes: pe.notes,
              parentId: pe.parentId || pe.id
            });
          }
        }
      });

      const manualLeinePE = nextMonthData.people.leine.personalExpenses.filter(e => {
        if (!e.parentId) return true;
        const parentStillExists = prevMonthData.people.leine.personalExpenses.some(pe => (pe.parentId || pe.id) === e.parentId);
        if (!parentStillExists) return false;
        const isStillPropagating = activeLeinePEParentIds.includes(e.parentId);
        if (!isStillPropagating) return false;
        return false;
      });

      nextMonthData.people.leine.personalExpenses = [...manualLeinePE, ...propagatedLeinePEForNext];

      nextMonthData.lastUpdated = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' }) + ' às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      allMonths[monthName] = nextMonthData;

      // Update nextHistory copy totals
      const totalExp = nextMonthData.expenses.reduce((sum, item) => sum + item.value, 0);
      const totalInv = nextMonthData.investments.reduce((sum, item) => sum + item.saldo, 0);

      const histIdx = nextHistory.findIndex(h => h.monthYear === monthName);
      if (histIdx !== -1) {
        nextHistory[histIdx] = {
          ...nextHistory[histIdx],
          totalExpenses: totalExp,
          totalInvestments: totalInv
        };
      } else {
        nextHistory.push({
          id: generateId('hist'),
          monthYear: monthName,
          totalExpenses: totalExp,
          totalInvestments: totalInv,
          isCurrent: false
        });
      }

      prevMonthData = nextMonthData;
    }

    // Update active month totals in nextHistory
    const activeTotalExp = sanitizedData.expenses.reduce((sum, item) => sum + item.value, 0);
    const activeTotalInv = sanitizedData.investments.reduce((sum, item) => sum + item.saldo, 0);

    const activeHistIdx = nextHistory.findIndex(h => h.monthYear === sanitizedData.monthYear);
    if (activeHistIdx !== -1) {
      nextHistory[activeHistIdx] = {
        ...nextHistory[activeHistIdx],
        totalExpenses: activeTotalExp,
        totalInvestments: activeTotalInv
      };
    } else {
      nextHistory.unshift({
        id: generateId('hist'),
        monthYear: sanitizedData.monthYear,
        totalExpenses: activeTotalExp,
        totalInvestments: activeTotalInv,
        isCurrent: true
      });
    }

    // Sort nextHistory chronologically
    nextHistory.sort((a, b) => {
      const pa = parseMY(a.monthYear);
      const pb = parseMY(b.monthYear);
      if (pa.year !== pb.year) return pb.year - pa.year;
      return pb.idx - pa.idx;
    });

    // Ensure only the active month is marked current
    nextHistory = nextHistory.map(h => ({
      ...h,
      isCurrent: h.monthYear === sanitizedData.monthYear
    }));

    setHistoryMonths(nextHistory);
    localStorage.setItem('finflow_history', JSON.stringify(nextHistory));

    // Save allMonths to storage
    localStorage.setItem('finflow_months_data', JSON.stringify(allMonths));
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // --- INTERACTION HANDLERS ---

  // Investment
  const handleAddInvestment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInv.name || !newInv.saldo) return;
    
    const investmentItem: Investment = {
      id: generateId('inv'),
      name: newInv.name,
      saldo: parseFloat(newInv.saldo) || 0,
      aporte: parseFloat(newInv.aporte) || 0,
      variation: parseFloat(newInv.variation) || 0,
      institution: newInv.institution || "Geral",
      notes: newInv.notes || "-"
    };

    const updated = {
      ...activeMonthData,
      investments: [...activeMonthData.investments, investmentItem],
      lastUpdated: new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' }) + ' às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    saveState(updated);
    setShowAddInvModal(false);
    setNewInv({ name: '', saldo: '', aporte: '', variation: '', institution: '', notes: '' });
    triggerToast("Investimento adicionado com sucesso!");
  };

  const handleDeleteInvestment = (id: string) => {
    const updated = {
      ...activeMonthData,
      investments: activeMonthData.investments.filter(item => item.id !== id),
      lastUpdated: new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' }) + ' às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };
    saveState(updated);
    triggerToast("Investimento removido.");
  };

  const handleUpdateInvestment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInv || !editingInv.name) return;

    const updated = {
      ...activeMonthData,
      investments: activeMonthData.investments.map(item => 
        item.id === editingInv.id ? editingInv : item
      ),
      lastUpdated: new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' }) + ' às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    saveState(updated);
    setEditingInv(null);
    triggerToast("Investimento atualizado com sucesso!");
  };

  // Expense
  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExp.category || !newExp.value) return;

    const expenseItem: Expense = {
      id: generateId('exp'),
      category: newExp.category,
      value: parseFloat(newExp.value) || 0,
      installments: newExp.installments || "1/1",
      notes: newExp.notes || "-",
      isRecurring: newExp.isRecurring || false
    };

    const updated = {
      ...activeMonthData,
      expenses: [...activeMonthData.expenses, expenseItem],
      lastUpdated: new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' }) + ' às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    saveState(updated);
    setShowAddExpModal(false);
    setNewExp({ category: '', value: '', installments: '1/1', notes: '', isRecurring: false });
    triggerToast("Despesa adicionada com sucesso!");
  };

  const handleDeleteExpense = (id: string) => {
    const updated = {
      ...activeMonthData,
      expenses: activeMonthData.expenses.filter(item => item.id !== id),
      lastUpdated: new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' }) + ' às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };
    saveState(updated);
    triggerToast("Despesa removida.");
  };

  const toggleExpenseRecurring = (id: string) => {
    const updated = {
      ...activeMonthData,
      expenses: activeMonthData.expenses.map(item => {
        if (item.id === id) {
          return { ...item, isRecurring: !item.isRecurring };
        }
        return item;
      }),
      lastUpdated: new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' }) + ' às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };
    saveState(updated);
    triggerToast("Configuração de despesa recorrente atualizada!");
  };

  // Personal Expense
  const handleAddPersonalExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPersonalExp.description || !newPersonalExp.value) return;

    const personKey = showAddPersonalModal.person;
    const item: PersonalExpense = {
      id: generateId('pe'),
      description: newPersonalExp.description,
      value: parseFloat(newPersonalExp.value) || 0,
      installments: newPersonalExp.installments || '1/1',
      notes: newPersonalExp.notes || '-'
    };

    const personData = activeMonthData.people[personKey];
    const updated = {
      ...activeMonthData,
      people: {
        ...activeMonthData.people,
        [personKey]: {
          ...personData,
          personalExpenses: [...personData.personalExpenses, item]
        }
      },
      lastUpdated: new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' }) + ' às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    saveState(updated);
    setShowAddPersonalModal({ show: false, person: 'ludmila' });
    setNewPersonalExp({ description: '', value: '', installments: '1/1', notes: '' });
    triggerToast(`Gasto pessoal de ${personData.name} adicionado!`);
  };

  const handleUpdateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExp || !editingExp.category) return;

    const updated = {
      ...activeMonthData,
      expenses: activeMonthData.expenses.map(item => 
        item.id === editingExp.id ? editingExp : item
      ),
      lastUpdated: new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' }) + ' às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    saveState(updated);
    setEditingExp(null);
    triggerToast("Despesa atualizada com sucesso!");
  };

  const handleUpdatePersonalExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPersonalExp || !editingPersonalExp.expense.description) return;

    const { person, expense } = editingPersonalExp;
    const personData = activeMonthData.people[person];
    const updated = {
      ...activeMonthData,
      people: {
        ...activeMonthData.people,
        [person]: {
          ...personData,
          personalExpenses: personData.personalExpenses.map(item =>
            item.id === expense.id ? expense : item
          )
        }
      },
      lastUpdated: new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' }) + ' às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    saveState(updated);
    setEditingPersonalExp(null);
    triggerToast(`Gasto pessoal de ${personData.name} atualizado!`);
  };

  const handleDeletePersonalExpense = (personKey: 'ludmila' | 'leine', id: string) => {
    const personData = activeMonthData.people[personKey];
    const updated = {
      ...activeMonthData,
      people: {
        ...activeMonthData.people,
        [personKey]: {
          ...personData,
          personalExpenses: personData.personalExpenses.filter(item => item.id !== id)
        }
      },
      lastUpdated: new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' }) + ' às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };
    saveState(updated);
    triggerToast(`Gasto pessoal de ${personData.name} removido.`);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const MONTH_NAMES = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", 
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    
    const [monthStr, yearStr] = activeMonthData.monthYear.split(' ');
    if (!monthStr || !yearStr) {
      triggerToast("Formato de mês inválido.");
      return;
    }
    
    const year = parseInt(yearStr, 10);
    const currentIdx = MONTH_NAMES.indexOf(monthStr);
    if (currentIdx === -1) {
      triggerToast("Mês inválido.");
      return;
    }
    
    let targetMonthStr = '';
    let targetYear = year;
    
    if (direction === 'next') {
      let nextIdx = currentIdx + 1;
      if (nextIdx >= 12) {
        nextIdx = 0;
        targetYear += 1;
      }
      targetMonthStr = `${MONTH_NAMES[nextIdx]} ${targetYear}`;
    } else {
      let prevIdx = currentIdx - 1;
      if (prevIdx < 0) {
        prevIdx = 11;
        targetYear -= 1;
      }
      targetMonthStr = `${MONTH_NAMES[prevIdx]} ${targetYear}`;
    }

    // Save current active month in multimonth storage before switching
    if (typeof window !== 'undefined') {
      const allMonthsStr = localStorage.getItem('finflow_months_data') || '{}';
      let allMonths: Record<string, any> = {};
      try {
        allMonths = JSON.parse(allMonthsStr);
      } catch (e) {}
      allMonths[activeMonthData.monthYear] = activeMonthData;
      localStorage.setItem('finflow_months_data', JSON.stringify(allMonths));
    }

    // Check if target month already exists
    if (typeof window !== 'undefined') {
      const allMonthsStr = localStorage.getItem('finflow_months_data');
      if (allMonthsStr) {
        try {
          const allMonths = JSON.parse(allMonthsStr);
          if (allMonths[targetMonthStr]) {
            // Yes, load it
            const targetData = allMonths[targetMonthStr];
            setActiveMonthData(targetData);
            localStorage.setItem('finflow_active_month', JSON.stringify(targetData));
            
            // Sync historyMonth highlight/current states
            const updatedHistory = historyMonths.map(h => ({
              ...h,
              isCurrent: h.monthYear === targetMonthStr
            }));
            setHistoryMonths(updatedHistory);
            localStorage.setItem('finflow_history', JSON.stringify(updatedHistory));
            
            triggerToast(`Navegou para ${targetMonthStr}`);
            return;
          }
        } catch (e) {
          console.error("Error loading month", e);
        }
      }
    }

    // If it is 'next' and did not exist, we CREATE and INHERIT!
    if (direction === 'next') {
      // Advance installments and build next month
      const nextInvestments = activeMonthData.investments.map(inv => ({
        id: generateId('inv'),
        name: inv.name,
        saldo: inv.saldo,
        aporte: 0,
        variation: 0,
        institution: "",
        notes: ""
      }));

      // Expenses inheritance
      const nextExpenses = activeMonthData.expenses
        .map(exp => {
          const isInstallment = exp.installments && exp.installments.includes('/');
          if (isInstallment) {
            const parts = exp.installments.trim().split('/');
            const current = parseInt(parts[0], 10);
            const total = parseInt(parts[1], 10);
            if (!isNaN(current) && !isNaN(total)) {
              if (current >= total) {
                // Already finished last month, so do not carry over!
                return null;
              }
              // Advance installment
              return {
                id: generateId('exp'),
                category: exp.category,
                value: exp.value,
                installments: `${current + 1}/${total}`,
                notes: exp.notes
              };
            }
          }
          // Simple expense (non-installment)
          return {
            id: generateId('exp'),
            category: exp.category,
            value: exp.value,
            installments: "1/1",
            notes: ""
          };
        })
        .filter(exp => exp !== null) as Expense[];

      // Personal expenses inheritance for people:
      const nextPersonalLudmila = activeMonthData.people.ludmila.personalExpenses
        .map(pe => {
          if (pe.installments && pe.installments.includes('/')) {
            const parts = pe.installments.trim().split('/');
            const current = parseInt(parts[0], 10);
            const total = parseInt(parts[1], 10);
            if (!isNaN(current) && !isNaN(total)) {
              if (current >= total) {
                return null; // finished
              }
              return {
                id: generateId('pe'),
                description: pe.description,
                value: pe.value,
                installments: `${current + 1}/${total}`,
                notes: pe.notes
              };
            }
          }
          // Simple personal expense
          return {
            id: generateId('pe'),
            description: pe.description,
            value: pe.value,
            installments: "1/1",
            notes: ""
          };
        })
        .filter(pe => pe !== null) as PersonalExpense[];

      const nextPersonalLeine = activeMonthData.people.leine.personalExpenses
        .map(pe => {
          if (pe.installments && pe.installments.includes('/')) {
            const parts = pe.installments.trim().split('/');
            const current = parseInt(parts[0], 10);
            const total = parseInt(parts[1], 10);
            if (!isNaN(current) && !isNaN(total)) {
              if (current >= total) {
                return null; // finished
              }
              return {
                id: generateId('pe'),
                description: pe.description,
                value: pe.value,
                installments: `${current + 1}/${total}`,
                notes: pe.notes
              };
            }
          }
          // Simple personal expense
          return {
            id: generateId('pe'),
            description: pe.description,
            value: pe.value,
            installments: "1/1",
            notes: ""
          };
        })
        .filter(pe => pe !== null) as PersonalExpense[];

      const newMonthData: MonthlyData = {
        monthYear: targetMonthStr,
        lastUpdated: new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' }) + ' às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        investments: nextInvestments,
        expenses: nextExpenses,
        splitRatioLudmila: activeMonthData.splitRatioLudmila ?? 60,
        people: {
          ludmila: {
            name: activeMonthData.people.ludmila.name || "Ludmilla",
            budgetLimit: activeMonthData.people.ludmila.budgetLimit,
            personalExpenses: nextPersonalLudmila
          },
          leine: {
            name: activeMonthData.people.leine.name || "Leinimer",
            budgetLimit: activeMonthData.people.leine.budgetLimit,
            personalExpenses: nextPersonalLeine
          }
        }
      };

      // Save new active month in states and localStorage
      setActiveMonthData(newMonthData);
      localStorage.setItem('finflow_active_month', JSON.stringify(newMonthData));

      // Add to multi-month store
      if (typeof window !== 'undefined') {
        const allMonthsStr = localStorage.getItem('finflow_months_data') || '{}';
        let allMonths: Record<string, any> = {};
        try { allMonths = JSON.parse(allMonthsStr); } catch (e) {}
        allMonths[targetMonthStr] = newMonthData;
        localStorage.setItem('finflow_months_data', JSON.stringify(allMonths));
      }

      // Add to history list if not already there
      const totalExpSum = newMonthData.expenses.reduce((sum, item) => sum + item.value, 0);
      const totalInvSum = newMonthData.investments.reduce((sum, item) => sum + item.saldo, 0);
      
      let nextHistory = [...historyMonths];
      const existsInHistory = nextHistory.some(h => h.monthYear === targetMonthStr);
      
      if (!existsInHistory) {
        nextHistory.unshift({
          id: generateId('hist'),
          monthYear: targetMonthStr,
          totalExpenses: totalExpSum,
          totalInvestments: totalInvSum,
          isCurrent: true
        });
      }

      nextHistory = nextHistory.map(h => ({
        ...h,
        isCurrent: h.monthYear === targetMonthStr
      }));

      setHistoryMonths(nextHistory);
      localStorage.setItem('finflow_history', JSON.stringify(nextHistory));

      triggerToast(`Criou e herdou dados para o novo mês: ${targetMonthStr}`);
    } else {
      // If going backwards and previous month does not exist, create a blank or empty one
      const blankMonthData: MonthlyData = {
        monthYear: targetMonthStr,
        lastUpdated: new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' }) + ' às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        investments: [],
        expenses: [],
        splitRatioLudmila: 60,
        people: {
          ludmila: { name: "Ludmilla", budgetLimit: 1400, personalExpenses: [] },
          leine: { name: "Leinimer", budgetLimit: 1400, personalExpenses: [] }
        }
      };

      setActiveMonthData(blankMonthData);
      localStorage.setItem('finflow_active_month', JSON.stringify(blankMonthData));

      if (typeof window !== 'undefined') {
        const allMonthsStr = localStorage.getItem('finflow_months_data') || '{}';
        let allMonths: Record<string, any> = {};
        try { allMonths = JSON.parse(allMonthsStr); } catch (e) {}
        allMonths[targetMonthStr] = blankMonthData;
        localStorage.setItem('finflow_months_data', JSON.stringify(allMonths));
      }

      let nextHistory = [...historyMonths];
      const existsInHistory = nextHistory.some(h => h.monthYear === targetMonthStr);
      if (!existsInHistory) {
        nextHistory.unshift({
          id: generateId('hist'),
          monthYear: targetMonthStr,
          totalExpenses: 0,
          totalInvestments: 0,
          isCurrent: true
        });
      }
      nextHistory = nextHistory.map(h => ({
        ...h,
        isCurrent: h.monthYear === targetMonthStr
      }));
      setHistoryMonths(nextHistory);
      localStorage.setItem('finflow_history', JSON.stringify(nextHistory));

      triggerToast(`Mês anterior criado: ${targetMonthStr}`);
    }
  };

  const handleSaveAll = () => {
    triggerToast("Todos os dados foram salvos no armazenamento local!");
  };

  const handleCompleteMonth = () => {
    const currentMonthLabel = activeMonthData.monthYear;
    
    // Add to history if not there or update
    const alreadyExists = historyMonths.some(h => h.monthYear === currentMonthLabel);
    let nextHistory = [...historyMonths];
    
    if (!alreadyExists) {
      nextHistory.unshift({
        id: 'hist-' + Date.now(),
        monthYear: currentMonthLabel,
        totalExpenses: activeMonthData.expenses.reduce((sum, item) => sum + item.value, 0),
        totalInvestments: activeMonthData.investments.reduce((sum, item) => sum + item.saldo, 0),
        isCurrent: true
      });
    }

    // Set other months isCurrent to false
    nextHistory = nextHistory.map(h => ({
      ...h,
      isCurrent: h.monthYear === currentMonthLabel
    }));

    setHistoryMonths(nextHistory);
    localStorage.setItem('finflow_history', JSON.stringify(nextHistory));
    
    triggerToast(`Mês de ${currentMonthLabel} concluído e consolidado no Histórico!`);
    setActiveTab('history');
  };

  const resetToDefault = () => {
    if (confirm("Deseja realmente resetar os dados para os valores originais da imagem?")) {
      setActiveMonthData(INITIAL_ACTIVE_MONTH);
      setHistoryMonths(INITIAL_HISTORY);
      localStorage.removeItem('finflow_active_month');
      localStorage.removeItem('finflow_history');
      triggerToast("Dados resetados para os padrões originais.");
    }
  };

  // --- DYNAMIC MATH CALCULATIONS ---
  
  // Active month summary
  const totalInvestmentsActive = activeMonthData.investments.reduce((sum, item) => sum + item.saldo, 0);
  const totalExpensesActive = activeMonthData.expenses.reduce((sum, item) => sum + item.value, 0);
  
  // Share calculations
  const splitRatioLudmila = activeMonthData.splitRatioLudmila ?? 50;
  const splitRatioLeine = 100 - splitRatioLudmila;
  
  const ludmilaSharedExpenses = (totalExpensesActive * splitRatioLudmila) / 100;
  const leineSharedExpenses = (totalExpensesActive * splitRatioLeine) / 100;
  
  const ludmilaPersonalTotal = activeMonthData.people.ludmila.personalExpenses.reduce((sum, item) => sum + item.value, 0);
  const ludmilaGrandTotal = ludmilaSharedExpenses + ludmilaPersonalTotal;

  const leinePersonalTotal = activeMonthData.people.leine.personalExpenses.reduce((sum, item) => sum + item.value, 0);
  const leineGrandTotal = leineSharedExpenses + leinePersonalTotal;

  // Format currencies helper
  const fmt = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-[#6366f1] selection:text-white" id="finflow-app">
      
      {/* Toast Alert Banner */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-[#0f172a] text-white px-6 py-3 rounded-lg shadow-xl border border-white/10 flex items-center gap-3 text-sm md:text-base font-medium"
            id="toast-alert"
          >
            <div className="w-2 h-2 rounded-full bg-[#dcfce7] animate-ping" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- HEADER --- */}
      <header className="bg-white border-b border-[#e2e8f0] sticky top-0 z-40 transition-shadow hover:shadow-sm" id="main-header">
        <div className="max-w-7xl mx-auto px-4 md:px-12 h-20 flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('analyses')} id="brand-logo">
            <span className="text-[#6366f1] font-semibold text-2xl tracking-tight font-sans">
              FinFlow
            </span>
            <div className="w-2 h-2 rounded-full bg-[#6366f1]" />
          </div>

          {/* Navigation Menu */}
          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium" id="header-nav">
            <button 
              onClick={() => setActiveTab('analyses')} 
              className={`relative py-2 transition-colors ${activeTab === 'analyses' ? 'text-[#6366f1]' : 'text-[#64748b] hover:text-[#0f172a]'}`}
              id="nav-tab-analyses"
            >
              Análises
              {activeTab === 'analyses' && (
                <motion.div layoutId="nav-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#6366f1]" />
              )}
            </button>
            <button 
              onClick={() => setActiveTab('dashboard')} 
              className={`relative py-2 transition-colors ${activeTab === 'dashboard' ? 'text-[#6366f1]' : 'text-[#64748b] hover:text-[#0f172a]'}`}
              id="nav-tab-dashboard"
            >
              Dashboard
              {activeTab === 'dashboard' && (
                <motion.div layoutId="nav-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#6366f1]" />
              )}
            </button>
            <button 
              onClick={() => setActiveTab('history')} 
              className={`relative py-2 transition-colors ${activeTab === 'history' ? 'text-[#6366f1]' : 'text-[#64748b] hover:text-[#0f172a]'}`}
              id="nav-tab-history"
            >
              Histórico
              {activeTab === 'history' && (
                <motion.div layoutId="nav-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#6366f1]" />
              )}
            </button>
            <button 
              onClick={() => setActiveTab('settings')} 
              className={`relative py-2 transition-colors ${activeTab === 'settings' ? 'text-[#6366f1]' : 'text-[#64748b] hover:text-[#0f172a]'}`}
              id="nav-tab-settings"
            >
              Configurações
              {activeTab === 'settings' && (
                <motion.div layoutId="nav-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#6366f1]" />
              )}
            </button>
          </nav>

          {/* User Controls & Actions */}
          <div className="flex items-center space-x-4" id="header-controls">
            
            {/* Notifications Button */}
            <button 
              className="relative p-2 rounded-full hover:bg-[#e0e7ff] text-[#64748b] hover:text-[#6366f1] transition-all"
              onClick={() => {
                setShowNotificationCount(0);
                triggerToast("Notificações marcadas como lidas.");
              }}
              title="Notificações"
              id="notification-bell-btn"
            >
              <Bell className="w-5 h-5" />
              {showNotificationCount > 0 && (
                <span className="absolute top-1 right-1 w-4.5 h-4.5 bg-[#ef4444] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {showNotificationCount}
                </span>
              )}
            </button>

            {/* Settings Quick Link */}
            <button 
              onClick={() => setActiveTab('settings')}
              className={`p-2 rounded-full transition-all hover:bg-[#e0e7ff] ${activeTab === 'settings' ? 'text-[#6366f1] bg-[#e0e7ff]' : 'text-[#64748b] hover:text-[#6366f1]'}`}
              title="Configurações"
              id="settings-gear-btn"
            >
              <Settings className="w-5 h-5" />
            </button>

            {/* Beautiful Profile Avatar */}
            <div className="flex items-center space-x-2 pl-2 border-l border-[#e2e8f0]" id="profile-block">
              <div className="w-10 h-10 rounded-full bg-[#f1f5f9] border border-[#6366f1]/10 overflow-hidden flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-[#6366f1] transition-all">
                {/* Visual Initials resembling a custom avatar profile */}
                <span className="text-sm font-semibold text-[#6366f1]">LL</span>
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-semibold text-[#0f172a]">Família L&L</p>
                <p className="text-[10px] text-[#64748b]">Premium</p>
              </div>
            </div>

          </div>

        </div>
      </header>

      {/* --- MOBILE NAVIGATION RAIL --- */}
      <div className="md:hidden bg-white border-b border-[#e2e8f0] flex justify-around py-3 px-2 text-xs font-medium sticky top-20 z-30" id="mobile-tab-bar">
        <button 
          onClick={() => setActiveTab('analyses')} 
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg ${activeTab === 'analyses' ? 'text-[#6366f1] bg-[#e0e7ff]' : 'text-[#64748b]'}`}
          id="mobile-nav-analyses"
        >
          <TrendingUp className="w-4 h-4" />
          <span>Análises</span>
        </button>
        <button 
          onClick={() => setActiveTab('dashboard')} 
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg ${activeTab === 'dashboard' ? 'text-[#6366f1] bg-[#e0e7ff]' : 'text-[#64748b]'}`}
          id="mobile-nav-dashboard"
        >
          <DollarSign className="w-4 h-4" />
          <span>Dashboard</span>
        </button>
        <button 
          onClick={() => setActiveTab('history')} 
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg ${activeTab === 'history' ? 'text-[#6366f1] bg-[#e0e7ff]' : 'text-[#64748b]'}`}
          id="mobile-nav-history"
        >
          <Calendar className="w-4 h-4" />
          <span>Histórico</span>
        </button>
        <button 
          onClick={() => setActiveTab('settings')} 
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg ${activeTab === 'settings' ? 'text-[#6366f1] bg-[#e0e7ff]' : 'text-[#64748b]'}`}
          id="mobile-nav-settings"
        >
          <Settings className="w-4 h-4" />
          <span>Ajustes</span>
        </button>
      </div>

      {/* --- MAIN CONTENT CONTAINER --- */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-12 py-10" id="main-content">
        
        <AnimatePresence mode="wait">
          
          {/* ==============================================
              TAB 1: ANALYSES (Análise Comparativa)
              ============================================== */}
          {activeTab === 'analyses' && (
            <motion.div
              key="analyses-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-10"
              id="analyses-screen"
            >
              {/* Header section */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4" id="analyses-header-row">
                <div>
                  <h1 className="text-3xl font-semibold tracking-tight text-[#0f172a] mb-2 font-sans">
                    Análise Comparativa
                  </h1>
                  <p className="text-sm text-[#64748b]">
                    Insights detalhados e tendências de desempenho para o seu ecossistema financeiro.
                  </p>
                </div>
                
                <div className="flex items-center space-x-3" id="analyses-actions">
                  <button 
                    onClick={() => triggerToast("Relatório PDF gerado e pronto para download!")}
                    className="bg-[#6366f1] hover:bg-[#4f46e5] text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm flex items-center gap-2 hover:scale-[1.01]"
                    id="btn-export-pdf"
                  >
                    <Download className="w-4 h-4" />
                    <span>Exportar PDF</span>
                  </button>
                  
                  {/* Month Selection Dropdown */}
                  <div className="relative" id="analyses-month-selector">
                    <select
                      value={selectedAnalysisMonth}
                      onChange={(e) => {
                        setSelectedAnalysisMonth(e.target.value);
                        triggerToast(`Mostrando análises de ${e.target.value}`);
                      }}
                      className="bg-white border border-[#e2e8f0] text-[#0f172a] pl-10 pr-4 py-2.5 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#6366f1] cursor-pointer appearance-none shadow-sm min-w-[140px]"
                      id="select-analysis-month"
                    >
                      <option value="Março 2024">Março 2024</option>
                      <option value="Julho 2025">Julho 2025 (Atual)</option>
                    </select>
                    <Calendar className="w-4 h-4 text-[#64748b] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Dynamic Warning if Julho 2025 Selected */}
              {selectedAnalysisMonth === "Julho 2025" && (
                <div className="bg-[#e0e7ff] border border-[#6366f1]/15 rounded-xl p-4 flex items-center gap-3 text-sm text-[#6366f1]" id="analyses-dynamic-hint">
                  <Info className="w-5 h-5 flex-shrink-0" />
                  <span>
                    Estes dados são gerados <strong>em tempo real</strong> com base no seu preenchimento ativo da aba <strong>Dashboard</strong>. Modifique os valores lá para ver as análises atualizarem aqui!
                  </span>
                </div>
              )}

              {/* Summary Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="summary-cards-grid">
                
                {/* Total de Despesas */}
                <div className="bg-white rounded-xl border border-[#e2e8f0] p-6 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group" id="card-total-expenses">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-[#64748b]">Total de Despesas</span>
                    <div className="w-8 h-8 rounded-full bg-[#e0e7ff] flex items-center justify-center text-[#6366f1]">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mb-2">
                    <span className="text-2xl md:text-3xl font-semibold text-[#0f172a]">
                      {selectedAnalysisMonth === "Julho 2025" ? fmt(totalExpensesActive + ludmilaPersonalTotal + leinePersonalTotal) : "R$ 4.280,00"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mb-5 text-xs font-semibold text-[#ef4444]">
                    <span>+4.2% vs. mês anterior</span>
                  </div>
                  <div className="border-t border-[#f1f3f9] pt-4 space-y-2 text-xs text-[#64748b]">
                    <div className="flex justify-between">
                      <span>Últimos 3 Meses (Média)</span>
                      <span className="font-semibold text-[#0f172a]">R$ 4.100,00</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Mesmo mês no ano passado</span>
                      <span className="font-semibold text-[#0f172a]">R$ 3.850,00</span>
                    </div>
                  </div>
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-[#6366f1]/10 group-hover:bg-[#6366f1] transition-colors" />
                </div>

                {/* Total de Investimentos */}
                <div className="bg-white rounded-xl border border-[#e2e8f0] p-6 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group" id="card-total-investments">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-[#64748b]">Total de Investimentos</span>
                    <div className="w-8 h-8 rounded-full bg-[#e0e7ff] flex items-center justify-center text-[#6366f1]">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mb-2">
                    <span className="text-2xl md:text-3xl font-semibold text-[#0f172a]">
                      {selectedAnalysisMonth === "Julho 2025" ? fmt(totalInvestmentsActive) : "R$ 12.450,00"}
                    </span>
                  </div>
                  <div className="mb-5 inline-block bg-[#dcfce7]/20 text-[#166534] text-[11px] font-bold px-2 py-0.5 rounded-full">
                    +12.8% vs. mês anterior
                  </div>
                  <div className="border-t border-[#f1f3f9] pt-4 space-y-2 text-xs text-[#64748b]">
                    <div className="flex justify-between">
                      <span>Últimos 3 Meses (Média)</span>
                      <span className="font-semibold text-[#0f172a]">R$ 10.200,00</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Mesmo mês no ano passado</span>
                      <span className="font-semibold text-[#0f172a]">R$ 7.900,00</span>
                    </div>
                  </div>
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-[#dcfce7]/10 group-hover:bg-[#dcfce7] transition-colors" />
                </div>

                {/* Gastos Pessoais */}
                <div className="bg-white rounded-xl border border-[#e2e8f0] p-6 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group" id="card-personal-expenses">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-[#64748b]">Gastos Pessoais</span>
                    <div className="w-8 h-8 rounded-full bg-[#e0e7ff] flex items-center justify-center text-[#6366f1]">
                      <TrendingDown className="w-4 h-4 text-[#166534]" />
                    </div>
                  </div>
                  <div className="mb-2">
                    <span className="text-2xl md:text-3xl font-semibold text-[#0f172a]">
                      {selectedAnalysisMonth === "Julho 2025" ? fmt(ludmilaPersonalTotal + leinePersonalTotal) : "R$ 1.890,00"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mb-5 text-xs font-semibold text-[#166534]">
                    <span>-2.1% vs. mês anterior</span>
                  </div>
                  <div className="border-t border-[#f1f3f9] pt-4 space-y-2 text-xs text-[#64748b]">
                    <div className="flex justify-between">
                      <span>Últimos 3 Meses (Média)</span>
                      <span className="font-semibold text-[#0f172a]">R$ 1.940,00</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Mesmo mês no ano passado</span>
                      <span className="font-semibold text-[#0f172a]">R$ 1.600,00</span>
                    </div>
                  </div>
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-[#6366f1]/10 group-hover:bg-[#6366f1] transition-colors" />
                </div>

              </div>

              {/* Section: Análise Detalhada de Despesas */}
              <div className="space-y-6" id="section-detailed-analyses">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight text-[#0f172a]" id="section-title-detailed-expenses">
                    Análise Detalhada de Despesas
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="barcharts-grid">
                  
                  {/* Eletricidade Card */}
                  <div className="bg-white rounded-xl border border-[#e2e8f0] p-6 shadow-xs flex flex-col justify-between" id="barchart-card-electricity">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-[#e0e7ff] text-[#6366f1] rounded-lg">
                          <Bolt className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-semibold text-[#0f172a]">Eletricidade</span>
                      </div>
                      <span className="text-xs font-semibold text-[#ef4444]">Consumo +5%</span>
                    </div>

                    {/* Chart visual representation */}
                    <div className="h-32 flex items-end justify-between gap-2.5 px-2 mt-4" id="chart-electricity">
                      {[180, 195, 210, 205, 220, 240].map((val, idx) => (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer relative">
                          <div 
                            className={`w-full rounded-t-sm transition-all duration-300 ${idx === 5 ? 'bg-[#6366f1]' : 'bg-[#e5eeff] group-hover:bg-[#d0e0ff]'}`}
                            style={{ height: `${(val / 240) * 85}px` }}
                          />
                          <span className="text-[10px] text-[#64748b] tracking-tight">
                            {idx === 0 ? 'Set' : idx === 5 ? 'Atual' : ''}
                          </span>
                          
                          {/* Tooltip */}
                          <div className="absolute bottom-full mb-1 bg-[#0f172a] text-white text-[10px] py-1 px-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                            R$ {val}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-[#f1f3f9] pt-4 mt-4 flex justify-between text-xs text-[#64748b]" id="chart-info-electricity">
                      <span>Setembro</span>
                      <span className="font-semibold text-[#0f172a]">Atual: R$ {selectedAnalysisMonth === "Julho 2025" ? totalExpensesActive > 0 ? (activeMonthData.expenses.find(e => e.category === 'Eletricidade')?.value || 180) : 180 : 240}</span>
                    </div>
                  </div>

                  {/* Água Card */}
                  <div className="bg-white rounded-xl border border-[#e2e8f0] p-6 shadow-xs flex flex-col justify-between" id="barchart-card-water">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-[#e0e7ff] text-[#6366f1] rounded-lg">
                          <Droplet className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-semibold text-[#0f172a]">Água</span>
                      </div>
                      <span className="text-xs font-semibold text-[#166534]">Consumo -2%</span>
                    </div>

                    {/* Chart representation */}
                    <div className="h-32 flex items-end justify-between gap-2.5 px-2 mt-4" id="chart-water">
                      {[115, 110, 105, 120, 100, 95].map((val, idx) => (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer relative">
                          <div 
                            className={`w-full rounded-t-sm transition-all duration-300 ${idx === 5 ? 'bg-[#6366f1]' : 'bg-[#e5eeff] group-hover:bg-[#d0e0ff]'}`}
                            style={{ height: `${(val / 120) * 85}px` }}
                          />
                          <span className="text-[10px] text-[#64748b] tracking-tight">
                            {idx === 0 ? 'Set' : idx === 5 ? 'Atual' : ''}
                          </span>

                          {/* Tooltip */}
                          <div className="absolute bottom-full mb-1 bg-[#0f172a] text-white text-[10px] py-1 px-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                            R$ {val}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-[#f1f3f9] pt-4 mt-4 flex justify-between text-xs text-[#64748b]" id="chart-info-water">
                      <span>Setembro</span>
                      <span className="font-semibold text-[#0f172a]">Atual: R$ 95</span>
                    </div>
                  </div>

                  {/* Cartões de Crédito Card */}
                  <div className="bg-white rounded-xl border border-[#e2e8f0] p-6 shadow-xs flex flex-col justify-between" id="barchart-card-credit">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-[#e0e7ff] text-[#6366f1] rounded-lg">
                          <CreditCard className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-semibold text-[#0f172a]">Cartões de Crédito</span>
                      </div>
                      <span className="text-xs font-semibold text-[#64748b]">Estável</span>
                    </div>

                    {/* Chart representation */}
                    <div className="h-32 flex items-end justify-between gap-2.5 px-2 mt-4" id="chart-credit">
                      {[3200, 3100, 3500, 3300, 3400, 3420].map((val, idx) => (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer relative">
                          <div 
                            className={`w-full rounded-t-sm transition-all duration-300 ${idx === 5 ? 'bg-[#6366f1]' : 'bg-[#e5eeff] group-hover:bg-[#d0e0ff]'}`}
                            style={{ height: `${(val / 3500) * 85}px` }}
                          />
                          <span className="text-[10px] text-[#64748b] tracking-tight">
                            {idx === 0 ? 'Set' : idx === 5 ? 'Atual' : ''}
                          </span>

                          {/* Tooltip */}
                          <div className="absolute bottom-full mb-1 bg-[#0f172a] text-white text-[10px] py-1 px-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                            R$ {val}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-[#f1f3f9] pt-4 mt-4 flex justify-between text-xs text-[#64748b]" id="chart-info-credit">
                      <span>Setembro</span>
                      <span className="font-semibold text-[#0f172a]">Atual: R$ {selectedAnalysisMonth === "Julho 2025" ? totalExpensesActive > 0 ? (activeMonthData.expenses.find(e => e.category === 'Cartão de Crédito')?.value || 1000) : 1000 : 3.420}</span>
                    </div>
                  </div>

                </div>
              </div>

              {/* Lower Section: Donut + Progress Bars splits */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8" id="analyses-lower-row">
                
                {/* Crescimento de Investimentos (Donut) */}
                <div className="bg-white rounded-xl border border-[#e2e8f0] p-6 shadow-xs" id="analyses-donut-card">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold tracking-tight text-[#0f172a]" id="title-investment-growth">
                      Crescimento de Investimentos
                    </h3>
                    <button 
                      onClick={() => triggerToast("Detalhes da alocação de ativos...")}
                      className="text-xs text-[#6366f1] font-medium hover:underline"
                    >
                      Detalhes
                    </button>
                  </div>

                  {/* Donut Chart representation */}
                  <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-4" id="donut-body">
                    
                    {/* SVG Circular Donut representation */}
                    <div className="relative w-40 h-40 flex items-center justify-center" id="donut-svg-wrapper">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        {/* Segment 1: Renda Variável (70% in March 2024, or dynamically computed) */}
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="transparent"
                          stroke="#e5eeff"
                          strokeWidth="10"
                        />
                        {/* 70% segment */}
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="transparent"
                          stroke="#6366f1"
                          strokeWidth="10"
                          strokeDasharray={`${2 * Math.PI * 40}`}
                          strokeDashoffset={`${2 * Math.PI * 40 * (1 - 0.7)}`}
                        />
                        {/* 30% segment */}
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="transparent"
                          stroke="#166534"
                          strokeWidth="10"
                          strokeDasharray={`${2 * Math.PI * 40}`}
                          strokeDashoffset={`${2 * Math.PI * 40 * (1 - 0.3)}`}
                          className="transform origin-center rotate-[252deg]"
                        />
                      </svg>
                      {/* Center Content */}
                      <div className="absolute flex flex-col items-center justify-center text-center" id="donut-center-label">
                        <span className="text-[11px] font-medium text-[#64748b]">Total</span>
                        <span className="text-lg font-bold text-[#0f172a]">100%</span>
                      </div>
                    </div>

                    {/* Donut Legend */}
                    <div className="space-y-4" id="donut-legend">
                      <div className="flex items-center gap-3">
                        <div className="w-3.5 h-3.5 rounded-full bg-[#6366f1]" />
                        <div>
                          <p className="text-xs font-semibold text-[#0f172a]">Renda Variável</p>
                          <p className="text-[11px] text-[#64748b] font-mono">70% Alocação</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-3.5 h-3.5 rounded-full bg-[#166534]" />
                        <div>
                          <p className="text-xs font-semibold text-[#0f172a]">Renda Fixa</p>
                          <p className="text-[11px] text-[#64748b] font-mono">30% Alocação</p>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Donut Footer Performance bar */}
                  <div className="bg-[#e0e7ff] rounded-lg p-3.5 flex items-center justify-between text-xs font-semibold text-[#6366f1] mt-4" id="donut-performance">
                    <span>Desempenho Mensal</span>
                    <span>+2.4%</span>
                  </div>
                </div>

                {/* Divisão de Gastos Pessoais (Meters) */}
                <div className="bg-white rounded-xl border border-[#e2e8f0] p-6 shadow-xs flex flex-col justify-between" id="analyses-split-card">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold tracking-tight text-[#0f172a]" id="title-personal-expenses-split">
                      Divisão de Gastos Pessoais
                    </h3>
                    <span className="text-xs text-[#64748b] font-medium">Por Categoria</span>
                  </div>

                  <div className="space-y-6 flex-1 flex flex-col justify-center" id="split-progress-bars">
                    
                    {/* Ludmila */}
                    <div className="space-y-2" id="progress-ludmila">
                      <div className="flex justify-between items-baseline">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-[#f1f5f9] text-[#6366f1] font-bold text-xs flex items-center justify-center">
                            L
                          </div>
                          <div>
                            <span className="text-base font-semibold text-[#0f172a]">Ludmilla</span>
                            <p className="text-xs text-[#64748b]">Uso do Orçamento (74%)</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold text-[#0f172a]">R$ 1.040</span>
                          <p className="text-[10px] text-[#64748b]">R$ 1.400 limite</p>
                        </div>
                      </div>
                      
                      {/* Meter bar */}
                      <div className="w-full h-3 bg-[#f1f5f9]/45 rounded-full overflow-hidden" id="meter-bar-ludmila">
                        <div className="h-full bg-[#6366f1] rounded-full transition-all duration-500" style={{ width: '74%' }} />
                      </div>
                    </div>

                    {/* Leine */}
                    <div className="space-y-2" id="progress-leine">
                      <div className="flex justify-between items-baseline">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-[#f1f5f9] text-[#6366f1] font-bold text-xs flex items-center justify-center">
                            L
                          </div>
                          <div>
                            <span className="text-base font-semibold text-[#0f172a]">{activeMonthData.people.leine.name}</span>
                            <p className="text-xs text-[#64748b]">Uso do Orçamento (60%)</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold text-[#0f172a]">R$ 850</span>
                          <p className="text-[10px] text-[#64748b]">R$ 1.400 limite</p>
                        </div>
                      </div>

                      {/* Meter bar */}
                      <div className="w-full h-3 bg-[#f1f5f9]/45 rounded-full overflow-hidden" id="meter-bar-leine">
                        <div className="h-full bg-[#6366f1] rounded-full transition-all duration-500" style={{ width: '60%' }} />
                      </div>
                    </div>

                  </div>
                </div>

              </div>

              {/* Reset to standard template banner */}
              <div className="pt-6 flex justify-center" id="analyses-reset-panel">
                <button 
                  onClick={resetToDefault}
                  className="text-xs text-[#64748b] hover:text-[#ef4444] flex items-center gap-1.5 transition-colors border border-dashed border-[#e2e8f0] px-4 py-2 rounded-lg hover:border-[#ef4444]/25"
                  id="btn-reset-original"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Resetar para os dados originais do template</span>
                </button>
              </div>

            </motion.div>
          )}

          {/* ==============================================
              TAB 2: MONTHLY LEDGER / DASHBOARD (Julho 2025)
              ============================================== */}
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-10"
              id="dashboard-screen"
            >
              
              {/* Timeline Header selector */}
              <div className="text-center space-y-2 mb-8" id="dashboard-timeline-header">
                <div className="flex items-center justify-center space-x-6">
                  <button 
                    onClick={() => navigateMonth('prev')}
                    className="p-2 rounded-full border border-[#e2e8f0] hover:bg-white text-[#64748b] hover:text-[#6366f1] transition-all"
                    id="btn-prev-month"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <h1 className="text-3xl font-bold tracking-tight text-[#0f172a] select-none font-sans" id="active-month-label">
                    {activeMonthData.monthYear}
                  </h1>
                  <button 
                    onClick={() => navigateMonth('next')}
                    className="p-2 rounded-full border border-[#e2e8f0] hover:bg-white text-[#64748b] hover:text-[#6366f1] transition-all"
                    id="btn-next-month"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-[#64748b]" id="label-last-updated">
                  Última atualização: {activeMonthData.lastUpdated}
                </p>
              </div>

              {/* SECTION A: INVESTIMENTOS */}
              <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-xs overflow-hidden" id="investment-section">
                
                {/* Title and action row */}
                <div className="px-6 py-5 border-b border-[#e2e8f0] flex justify-between items-center bg-[#fcfdff]" id="investment-header">
                  <div className="flex items-center space-x-3">
                    <div className="w-1.5 h-6 rounded bg-[#166534]" />
                    <h2 className="text-lg font-semibold tracking-tight text-[#0f172a]">
                      Carteira de Investimentos
                    </h2>
                  </div>
                  <button
                    onClick={() => setShowAddInvModal(true)}
                    className="text-xs bg-[#166534] hover:bg-[#14532d] text-white px-3.5 py-2 rounded-lg font-medium transition-all shadow-sm flex items-center gap-1.5"
                    id="btn-add-investment"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar investimento</span>
                  </button>
                </div>

                {/* Table list */}
                <div className="overflow-x-auto" id="investment-table-container">
                  <table className="w-full text-left border-collapse" id="investment-table">
                    <thead>
                      <tr className="bg-[#f1f5f9] text-[#64748b] text-xs font-semibold uppercase tracking-wider border-b border-[#e2e8f0]">
                        <th className="w-16 py-4 pl-6 pr-0"></th>
                        <th className="py-4 px-6">Nome</th>
                        <th className="py-4 px-6 text-right">Saldo Atual</th>
                        <th className="py-4 px-6 text-right">Aporte do Mês</th>
                        <th className="py-4 px-6 text-center">Variação (%)</th>
                        <th className="py-4 px-6">Instituição</th>
                        <th className="py-4 px-6">Observações</th>
                        <th className="py-4 px-6 text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f1f3f9] text-sm">
                      {activeMonthData.investments.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-[#64748b]">
                            Nenhum investimento registrado neste mês. Clique para adicionar!
                          </td>
                        </tr>
                      ) : (
                        activeMonthData.investments.map((inv, idx) => (
                          <tr 
                            key={inv.id} 
                            draggable
                            onDragStart={() => handleDragStart('investment', idx)}
                            onDragOver={(e) => handleDragOver(e, idx)}
                            onDrop={() => handleDrop('investment', idx)}
                            className={`hover:bg-[#f1f5f9]/45 transition-colors group ${draggedItem?.type === 'investment' && draggedItem.index === idx ? 'opacity-40 bg-[#f1f5f9]' : ''}`}
                          >
                            <td className="py-4 pl-6 pr-0 text-center w-12">
                              <div 
                                className="cursor-grab active:cursor-grabbing text-[#94a3b8] hover:text-[#64748b] p-1.5 rounded hover:bg-[#f1f5f9] inline-block"
                                title="Arraste para reordenar"
                              >
                                <GripVertical className="w-4 h-4" />
                              </div>
                            </td>
                            <td className="py-4 px-6 font-medium text-[#0f172a]">{inv.name}</td>
                            <td 
                              className="py-4 px-6 text-right font-mono font-medium text-[#0f172a] cursor-pointer hover:bg-indigo-50/50 rounded-sm transition-colors group/cell relative"
                              onClick={() => {
                                setInlineEdit({ type: 'inv-saldo', id: inv.id });
                                setInlineValue(inv.saldo.toString());
                              }}
                            >
                              {inlineEdit?.type === 'inv-saldo' && inlineEdit?.id === inv.id ? (
                                <input
                                  type="number"
                                  step="any"
                                  autoFocus
                                  value={inlineValue}
                                  onChange={(e) => setInlineValue(e.target.value)}
                                  onBlur={() => handleInlineSave('inv-saldo', inv.id, inlineValue)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handleInlineSave('inv-saldo', inv.id, inlineValue);
                                    } else if (e.key === 'Escape') {
                                      setInlineEdit(null);
                                    }
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-24 text-right bg-white border border-[#6366f1] rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-[#6366f1] font-mono text-sm"
                                />
                              ) : (
                                <span className="flex items-center justify-end gap-1">
                                  {fmt(inv.saldo)}
                                  <Pencil className="w-3 h-3 text-slate-400 opacity-0 group-hover/cell:opacity-100 transition-opacity" />
                                </span>
                              )}
                            </td>
                            <td 
                              className="py-4 px-6 text-right font-mono text-[#166534] cursor-pointer hover:bg-indigo-50/50 rounded-sm transition-colors group/cell relative"
                              onClick={() => {
                                setInlineEdit({ type: 'inv-aporte', id: inv.id });
                                setInlineValue(inv.aporte.toString());
                              }}
                            >
                              {inlineEdit?.type === 'inv-aporte' && inlineEdit?.id === inv.id ? (
                                <input
                                  type="number"
                                  step="any"
                                  autoFocus
                                  value={inlineValue}
                                  onChange={(e) => setInlineValue(e.target.value)}
                                  onBlur={() => handleInlineSave('inv-aporte', inv.id, inlineValue)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handleInlineSave('inv-aporte', inv.id, inlineValue);
                                    } else if (e.key === 'Escape') {
                                      setInlineEdit(null);
                                    }
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-24 text-right bg-white border border-[#6366f1] rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-[#6366f1] font-mono text-sm"
                                />
                              ) : (
                                <span className="flex items-center justify-end gap-1">
                                  {inv.aporte > 0 ? `+ ${fmt(inv.aporte)}` : fmt(0)}
                                  <Pencil className="w-3 h-3 text-slate-400 opacity-0 group-hover/cell:opacity-100 transition-opacity" />
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-6 text-center font-mono">
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${inv.variation >= 0 ? 'bg-[#dcfce7]/15 text-[#166534]' : 'bg-[#ffdad6]/40 text-[#ef4444]'}`}>
                                {inv.variation >= 0 ? `+${inv.variation}%` : `${inv.variation}%`}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-[#64748b]">{inv.institution}</td>
                            <td className="py-4 px-6 text-[#64748b] text-xs max-w-xs truncate" title={inv.notes}>{inv.notes}</td>
                            <td className="py-4 px-6 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button 
                                  onClick={() => setEditingInv(inv)}
                                  className="p-1.5 text-[#64748b] hover:text-[#6366f1] hover:bg-[#e0e7ff] rounded transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                  title="Editar"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteInvestment(inv.id)}
                                  className="p-1.5 text-[#64748b] hover:text-[#ef4444] hover:bg-[#ffdad6]/25 rounded transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                  title="Remover"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Patrimônio Total row */}
                <div className="bg-[#dcfce7]/15 border-t border-[#dcfce7]/35 px-6 py-5 flex justify-between items-center" id="investment-total-row">
                  <span className="text-xs font-bold text-[#14532d] uppercase tracking-wider">Patrimônio Total</span>
                  <span className="text-xl md:text-2xl font-bold text-[#14532d] font-mono">
                    {fmt(totalInvestmentsActive)}
                  </span>
                </div>
              </div>

              {/* SECTION B: DESPESAS DO MÊS */}
              <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-xs overflow-hidden" id="expense-section">
                
                {/* Header and Action */}
                <div className="px-6 py-5 border-b border-[#e2e8f0] flex justify-between items-center bg-[#fcfdff]" id="expense-header">
                  <div className="flex items-center space-x-3">
                    <div className="w-1.5 h-6 rounded bg-[#6366f1]" />
                    <h2 className="text-lg font-semibold tracking-tight text-[#0f172a]">
                      Despesas do Mês
                    </h2>
                  </div>
                  <button
                    onClick={() => setShowAddExpModal(true)}
                    className="text-xs bg-[#6366f1] hover:bg-[#4f46e5] text-white px-3.5 py-2 rounded-lg font-medium transition-all shadow-sm flex items-center gap-1.5"
                    id="btn-add-expense"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar despesa</span>
                  </button>
                </div>

                {/* Table representation */}
                <div className="overflow-x-auto" id="expense-table-container">
                  <table className="w-full text-left border-collapse" id="expense-table">
                    <thead>
                      <tr className="bg-[#f1f5f9] text-[#64748b] text-xs font-semibold uppercase tracking-wider border-b border-[#e2e8f0]">
                        <th className="w-16 py-4 pl-6 pr-0"></th>
                        <th className="w-12 py-4 px-2 text-center">Fixo</th>
                        <th className="py-4 px-6">Categoria</th>
                        <th className="py-4 px-6 text-right">Valor</th>
                        <th className="py-4 px-6 text-center">Parcelas</th>
                        <th className="py-4 px-6">Observações</th>
                        <th className="py-4 px-6 text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f1f3f9] text-sm">
                      {activeMonthData.expenses.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-[#64748b]">
                            Nenhuma despesa mensal cadastrada neste mês.
                          </td>
                        </tr>
                      ) : (
                        activeMonthData.expenses.map((exp, idx) => (
                          <tr 
                            key={exp.id} 
                            draggable
                            onDragStart={() => handleDragStart('expense', idx)}
                            onDragOver={(e) => handleDragOver(e, idx)}
                            onDrop={() => handleDrop('expense', idx)}
                            className={`hover:bg-[#f1f5f9]/45 transition-colors group ${draggedItem?.type === 'expense' && draggedItem.index === idx ? 'opacity-40 bg-[#f1f5f9]' : ''}`}
                          >
                            <td className="py-4 pl-6 pr-0 text-center w-12">
                              <div 
                                className="cursor-grab active:cursor-grabbing text-[#94a3b8] hover:text-[#64748b] p-1.5 rounded hover:bg-[#f1f5f9] inline-block"
                                title="Arraste para reordenar"
                              >
                                <GripVertical className="w-4 h-4" />
                              </div>
                            </td>
                            <td className="py-4 px-2 text-center w-12">
                              <button
                                onClick={() => toggleExpenseRecurring(exp.id)}
                                className="p-1.5 rounded-full hover:bg-amber-50 text-slate-300 hover:text-amber-500 transition-colors focus:outline-none"
                                title={exp.isRecurring ? "Remover de despesas recorrentes (repete todo mês)" : "Marcar como despesa recorrente (repete todo mês)"}
                              >
                                <Star className={`w-4 h-4 ${exp.isRecurring ? 'fill-amber-400 text-amber-400' : 'text-slate-300 hover:text-amber-400'}`} />
                              </button>
                            </td>
                            <td className="py-4 px-6 font-medium text-[#0f172a]">{exp.category}</td>
                            <td 
                              className="py-4 px-6 text-right font-mono font-medium text-[#0f172a] cursor-pointer hover:bg-indigo-50/50 rounded-sm transition-colors group/cell relative"
                              onClick={() => {
                                setInlineEdit({ type: 'exp', id: exp.id });
                                setInlineValue(exp.value.toString());
                              }}
                            >
                              {inlineEdit?.type === 'exp' && inlineEdit?.id === exp.id ? (
                                <input
                                  type="number"
                                  step="any"
                                  autoFocus
                                  value={inlineValue}
                                  onChange={(e) => setInlineValue(e.target.value)}
                                  onBlur={() => handleInlineSave('exp', exp.id, inlineValue)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handleInlineSave('exp', exp.id, inlineValue);
                                    } else if (e.key === 'Escape') {
                                      setInlineEdit(null);
                                    }
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-24 text-right bg-white border border-[#6366f1] rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-[#6366f1] font-mono text-sm"
                                />
                              ) : (
                                <span className="flex items-center justify-end gap-1">
                                  {fmt(exp.value)}
                                  <Pencil className="w-3 h-3 text-slate-400 opacity-0 group-hover/cell:opacity-100 transition-opacity" />
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-6 text-center text-sm font-bold text-[#6366f1] font-mono">{exp.installments}</td>
                            <td className="py-4 px-6 text-[#64748b]">{exp.notes}</td>
                            <td className="py-4 px-6 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button 
                                  onClick={() => setEditingExp(exp)}
                                  className="p-1.5 text-[#64748b] hover:text-[#6366f1] hover:bg-[#e0e7ff] rounded transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                  title="Editar"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteExpense(exp.id)}
                                  className="p-1.5 text-[#64748b] hover:text-[#ef4444] hover:bg-[#ffdad6]/25 rounded transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                  title="Remover"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Huge Summary Total Display at the bottom */}
                <div className="bg-[#e0e7ff]/65 border-t border-[#e0e7ff] py-8 text-center" id="expense-big-total">
                  <p className="text-[11px] font-bold text-[#6366f1] uppercase tracking-wider mb-2">
                    Total de Despesas do Mês
                  </p>
                  <p className="text-3xl md:text-4xl font-extrabold text-[#6366f1] font-mono">
                    {fmt(totalExpensesActive)}
                  </p>
                </div>
              </div>

              {/* SECTION C: FAMILY/PARTNER SPLIT */}
              <div className="grid grid-cols-1 gap-8" id="family-split-grid">
                
                {/* Leinimer Shared/Personal Card */}
                <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-xs relative overflow-hidden flex flex-col justify-between" id="split-card-leine">
                  <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#166534]" />
                  
                  <div className="p-6 pb-2" id="split-leine-header">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-2xl font-bold text-[#0f172a]">{activeMonthData.people.leine.name}</h3>
                      </div>
                      <div className="text-right flex flex-col items-end">
                        <p className="text-2xl font-extrabold text-[#166534] font-mono">{fmt(leineSharedExpenses)}</p>
                        <div className="flex items-center gap-1 mt-1.5 bg-[#f1f5f9] px-2 py-1 rounded-md w-fit border border-[#e2e8f0]">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={splitRatioLeine}
                            onChange={(e) => {
                              const val = Math.min(100, Math.max(0, parseFloat(e.target.value) || 0));
                              const updated = {
                                ...activeMonthData,
                                splitRatioLudmila: 100 - val,
                                lastUpdated: new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' }) + ' às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                              };
                              saveState(updated);
                            }}
                            className="w-10 bg-white text-xs font-bold text-[#166534] text-center border border-[#e2e8f0] rounded focus:outline-none focus:ring-1 focus:ring-[#166534] font-mono p-0.5"
                          />
                          <span className="text-[10px] text-[#64748b] font-medium">% do compartilhado</span>
                        </div>
                      </div>
                    </div>

                    {/* Personal items list header */}
                    <div className="border-t border-[#f1f3f9] pt-4 flex justify-between items-center mb-2" id="split-leine-sub-header">
                      <span className="text-xs font-bold text-[#0f172a] uppercase">Gastos Pessoais de {activeMonthData.people.leine.name}</span>
                      <button 
                        onClick={() => setShowAddPersonalModal({ show: true, person: 'leine' })}
                        className="text-[11px] text-[#6366f1] hover:text-[#4f46e5] font-semibold flex items-center gap-1 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Adicionar</span>
                      </button>
                    </div>
                  </div>

                  {/* Personal items rows list */}
                  <div className="px-6 py-2 flex-1" id="split-leine-items">
                    {activeMonthData.people.leine.personalExpenses.length === 0 ? (
                      <p className="py-4 text-center text-[#64748b] text-xs">Nenhum gasto pessoal registrado.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-[#e2e8f0] text-[10px] font-bold text-[#64748b] uppercase tracking-wider">
                              <th className="py-2.5 px-3 w-8"></th>
                              <th className="py-2.5 px-3">Item do Gasto</th>
                              <th className="py-2.5 px-3 w-28 text-center">Parcela</th>
                              <th className="py-2.5 px-3 w-32 text-right">Valor</th>
                              <th className="py-2.5 px-3">Observações</th>
                              <th className="py-2.5 px-3 w-20 text-right">Ações</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#f1f3f9]">
                            {activeMonthData.people.leine.personalExpenses.map((item, idx) => (
                              <tr 
                                key={item.id} 
                                draggable
                                onDragStart={() => handleDragStart('leine', idx)}
                                onDragOver={(e) => handleDragOver(e, idx)}
                                onDrop={() => handleDrop('leine', idx)}
                                className={`group hover:bg-[#f8fafc] transition-colors ${draggedItem?.type === 'leine' && draggedItem.index === idx ? 'opacity-40 bg-[#f1f5f9]' : ''}`}
                              >
                                <td className="py-2.5 px-3">
                                  <div 
                                    className="cursor-grab active:cursor-grabbing text-[#94a3b8] hover:text-[#64748b] p-1 rounded hover:bg-[#f1f5f9] inline-block"
                                    title="Arraste para reordenar"
                                  >
                                    <GripVertical className="w-3.5 h-3.5" />
                                  </div>
                                </td>
                                <td className="py-2.5 px-3 font-medium text-[#0f172a] text-sm truncate max-w-[200px]">
                                  {item.description}
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#e0f2fe] text-[#0369a1] font-mono">
                                    {item.installments || '1/1'}
                                  </span>
                                </td>
                                <td 
                                  className="py-2.5 px-3 text-right font-semibold text-[#0f172a] font-mono text-sm cursor-pointer hover:bg-indigo-50/50 rounded-sm transition-colors group/cell relative"
                                  onClick={() => {
                                    setInlineEdit({ type: 'pe-leine', id: item.id });
                                    setInlineValue(item.value.toString());
                                  }}
                                >
                                  {inlineEdit?.type === 'pe-leine' && inlineEdit?.id === item.id ? (
                                    <input
                                      type="number"
                                      step="any"
                                      autoFocus
                                      value={inlineValue}
                                      onChange={(e) => setInlineValue(e.target.value)}
                                      onBlur={() => handleInlineSave('pe-leine', item.id, inlineValue)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          handleInlineSave('pe-leine', item.id, inlineValue);
                                        } else if (e.key === 'Escape') {
                                          setInlineEdit(null);
                                        }
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                      className="w-24 text-right bg-white border border-[#6366f1] rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-[#6366f1] font-mono text-sm"
                                    />
                                  ) : (
                                    <span className="flex items-center justify-end gap-1">
                                      {fmt(item.value)}
                                      <Pencil className="w-2.5 h-2.5 text-slate-400 opacity-0 group-hover/cell:opacity-100 transition-opacity" />
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-[#64748b] text-sm truncate max-w-[200px]" title={item.notes}>
                                  {item.notes || '-'}
                                </td>
                                <td className="py-2.5 px-3 text-right">
                                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                      onClick={() => setEditingPersonalExp({ person: 'leine', expense: item })}
                                      className="p-1 text-[#64748b] hover:text-[#6366f1] rounded transition-colors"
                                      title="Editar"
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                    <button 
                                      onClick={() => handleDeletePersonalExpense('leine', item.id)}
                                      className="p-1 text-[#64748b] hover:text-[#ef4444] rounded transition-colors"
                                      title="Remover"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Totals section */}
                  <div className="bg-[#f1f5f9] border-t border-[#e2e8f0] p-6 space-y-2 text-xs" id="split-leine-footer">
                    <div className="flex justify-between items-center text-[#64748b]">
                      <span>Total pessoal:</span>
                      <span className="font-semibold font-mono text-[#0f172a]">{fmt(leinePersonalTotal)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-[#e2e8f0]/60">
                      <span className="text-sm font-bold text-[#0f172a]">Total Geral:</span>
                      <span className="text-base font-bold font-mono text-[#166534]">{fmt(leineGrandTotal)}</span>
                    </div>
                  </div>
                </div>

                {/* Ludmilla Shared/Personal Card */}
                <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-xs relative overflow-hidden flex flex-col justify-between" id="split-card-ludmila">
                  <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#6366f1]" />
                  
                  <div className="p-6 pb-2" id="split-ludmila-header">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-2xl font-bold text-[#0f172a]">Ludmilla</h3>
                      </div>
                      <div className="text-right flex flex-col items-end">
                        <p className="text-2xl font-extrabold text-[#6366f1] font-mono">{fmt(ludmilaSharedExpenses)}</p>
                        <div className="flex items-center gap-1 mt-1.5 bg-[#f1f5f9] px-2 py-1 rounded-md w-fit border border-[#e2e8f0]">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={splitRatioLudmila}
                            onChange={(e) => {
                              const val = Math.min(100, Math.max(0, parseFloat(e.target.value) || 0));
                              const updated = {
                                ...activeMonthData,
                                splitRatioLudmila: val,
                                lastUpdated: new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' }) + ' às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                              };
                              saveState(updated);
                            }}
                            className="w-10 bg-white text-xs font-bold text-[#6366f1] text-center border border-[#e2e8f0] rounded focus:outline-none focus:ring-1 focus:ring-[#6366f1] font-mono p-0.5"
                          />
                          <span className="text-[10px] text-[#64748b] font-medium">% do compartilhado</span>
                        </div>
                      </div>
                    </div>

                    {/* Personal item list headers */}
                    <div className="border-t border-[#f1f3f9] pt-4 flex justify-between items-center mb-2" id="split-ludmila-sub-header">
                      <span className="text-xs font-bold text-[#0f172a] uppercase">Gastos Pessoais de Ludmilla</span>
                      <button 
                        onClick={() => setShowAddPersonalModal({ show: true, person: 'ludmila' })}
                        className="text-[11px] text-[#6366f1] hover:text-[#4f46e5] font-semibold flex items-center gap-1 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Adicionar</span>
                      </button>
                    </div>
                  </div>

                  {/* Personal items rows list */}
                  <div className="px-6 py-2 flex-1" id="split-ludmila-items">
                    {activeMonthData.people.ludmila.personalExpenses.length === 0 ? (
                      <p className="py-4 text-center text-[#64748b] text-xs">Nenhum gasto pessoal registrado.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-[#e2e8f0] text-[10px] font-bold text-[#64748b] uppercase tracking-wider">
                              <th className="py-2.5 px-3 w-8"></th>
                              <th className="py-2.5 px-3">Item do Gasto</th>
                              <th className="py-2.5 px-3 w-28 text-center">Parcela</th>
                              <th className="py-2.5 px-3 w-32 text-right">Valor</th>
                              <th className="py-2.5 px-3">Observações</th>
                              <th className="py-2.5 px-3 w-20 text-right">Ações</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#f1f3f9]">
                            {activeMonthData.people.ludmila.personalExpenses.map((item, idx) => (
                              <tr 
                                key={item.id} 
                                draggable
                                onDragStart={() => handleDragStart('ludmila', idx)}
                                onDragOver={(e) => handleDragOver(e, idx)}
                                onDrop={() => handleDrop('ludmila', idx)}
                                className={`group hover:bg-[#f8fafc] transition-colors ${draggedItem?.type === 'ludmila' && draggedItem.index === idx ? 'opacity-40 bg-[#f1f5f9]' : ''}`}
                              >
                                <td className="py-2.5 px-3">
                                  <div 
                                    className="cursor-grab active:cursor-grabbing text-[#94a3b8] hover:text-[#64748b] p-1 rounded hover:bg-[#f1f5f9] inline-block"
                                    title="Arraste para reordenar"
                                  >
                                    <GripVertical className="w-3.5 h-3.5" />
                                  </div>
                                </td>
                                <td className="py-2.5 px-3 font-medium text-[#0f172a] text-sm truncate max-w-[200px]">
                                  {item.description}
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#e0e7ff] text-[#4f46e5] font-mono">
                                    {item.installments || '1/1'}
                                  </span>
                                </td>
                                <td 
                                  className="py-2.5 px-3 text-right font-semibold text-[#0f172a] font-mono text-sm cursor-pointer hover:bg-indigo-50/50 rounded-sm transition-colors group/cell relative"
                                  onClick={() => {
                                    setInlineEdit({ type: 'pe-ludmila', id: item.id });
                                    setInlineValue(item.value.toString());
                                  }}
                                >
                                  {inlineEdit?.type === 'pe-ludmila' && inlineEdit?.id === item.id ? (
                                    <input
                                      type="number"
                                      step="any"
                                      autoFocus
                                      value={inlineValue}
                                      onChange={(e) => setInlineValue(e.target.value)}
                                      onBlur={() => handleInlineSave('pe-ludmila', item.id, inlineValue)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          handleInlineSave('pe-ludmila', item.id, inlineValue);
                                        } else if (e.key === 'Escape') {
                                          setInlineEdit(null);
                                        }
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                      className="w-24 text-right bg-white border border-[#6366f1] rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-[#6366f1] font-mono text-sm"
                                    />
                                  ) : (
                                    <span className="flex items-center justify-end gap-1">
                                      {fmt(item.value)}
                                      <Pencil className="w-2.5 h-2.5 text-slate-400 opacity-0 group-hover/cell:opacity-100 transition-opacity" />
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-[#64748b] text-sm truncate max-w-[200px]" title={item.notes}>
                                  {item.notes || '-'}
                                </td>
                                <td className="py-2.5 px-3 text-right">
                                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                      onClick={() => setEditingPersonalExp({ person: 'ludmila', expense: item })}
                                      className="p-1 text-[#64748b] hover:text-[#6366f1] rounded transition-colors"
                                      title="Editar"
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                    <button 
                                      onClick={() => handleDeletePersonalExpense('ludmila', item.id)}
                                      className="p-1 text-[#64748b] hover:text-[#ef4444] rounded transition-colors"
                                      title="Remover"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Totals section */}
                  <div className="bg-[#f1f5f9] border-t border-[#e2e8f0] p-6 space-y-2 text-xs" id="split-ludmila-footer">
                    <div className="flex justify-between items-center text-[#64748b]">
                      <span>Total pessoal:</span>
                      <span className="font-semibold font-mono text-[#0f172a]">{fmt(ludmilaPersonalTotal)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-[#e2e8f0]/60">
                      <span className="text-sm font-bold text-[#0f172a]">Total Geral:</span>
                      <span className="text-base font-bold font-mono text-[#6366f1]">{fmt(ludmilaGrandTotal)}</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* SAVE / COMPLETE BOTTOM BAR */}
              <div className="flex items-center justify-end space-x-4 border-t border-[#e2e8f0] pt-8" id="dashboard-bottom-bar">
                <button 
                  onClick={handleSaveAll}
                  className="px-6 py-3 border border-[#6366f1] text-[#6366f1] hover:bg-[#e0e7ff] rounded-lg text-sm font-semibold transition-all shadow-sm"
                  id="btn-save-draft"
                >
                  Salvar
                </button>
                <button 
                  onClick={handleCompleteMonth}
                  className="px-6 py-3 bg-[#6366f1] hover:bg-[#4f46e5] text-white rounded-lg text-sm font-semibold transition-all shadow-md flex items-center gap-2"
                  id="btn-complete-month"
                >
                  <Check className="w-4 h-4" />
                  <span>Concluir Mês</span>
                </button>
              </div>

            </motion.div>
          )}

          {/* ==============================================
              TAB 3: TIMELINE HISTORY (Histórico Financeiro)
              ============================================== */}
          {activeTab === 'history' && (
            <motion.div
              key="history-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-10"
              id="history-screen"
            >
              
              {/* Header and top buttons */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4" id="history-header-row">
                <div>
                  <h1 className="text-3xl font-semibold tracking-tight text-[#0f172a] mb-2 font-sans">
                    Histórico Financeiro
                  </h1>
                  <p className="text-sm text-[#64748b] max-w-xl">
                    Uma visão serena de sua jornada financeira. Revise seu desempenho passado e acompanhe seu crescimento mensal.
                  </p>
                </div>
                
                <div className="flex items-center space-x-3" id="history-header-actions">
                  <button 
                    onClick={() => triggerToast("Filtros avançados...")}
                    className="bg-white border border-[#e2e8f0] hover:bg-[#f1f5f9] text-[#64748b] hover:text-[#0f172a] px-4 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm flex items-center gap-2"
                    id="btn-filter-history"
                  >
                    <Filter className="w-4 h-4" />
                    <span>Filtrar</span>
                  </button>
                  <button 
                    onClick={() => triggerToast("Histórico exportado em formato CSV!")}
                    className="bg-[#6366f1] hover:bg-[#4f46e5] text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm flex items-center gap-2"
                    id="btn-export-history"
                  >
                    <Download className="w-4 h-4" />
                    <span>Exportar</span>
                  </button>
                </div>
              </div>

              {/* Timeline Container */}
              <div className="relative pl-6 md:pl-10 border-l border-[#e2e8f0]/75 space-y-12 py-4 ml-2" id="timeline-container">
                
                {/* Dynamic Year Nodes */}
                {historyYears.map(year => (
                  <div className="relative" id={`timeline-node-${year}`} key={year}>
                    <div className="absolute -left-[31px] md:-left-[47px] top-1.5 w-4 h-4 rounded-full bg-white border-2 border-[#6366f1] z-10" />
                    <span className="text-sm font-bold text-[#64748b] tracking-wider uppercase font-mono">{year}</span>

                    {/* Months representation for the year */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6" id={`months-list-${year}`}>
                      {historyMonths
                        .filter(m => m.monthYear.endsWith(year))
                        .map(item => (
                          <div 
                            key={item.id} 
                            className={`bg-white rounded-xl border p-6 flex flex-col justify-between transition-all hover:shadow-lg ${item.isCurrent ? 'border-[#6366f1]/60 shadow-md ring-1 ring-[#6366f1]/10' : 'border-[#e2e8f0]'}`}
                            id={`history-card-${item.id}`}
                          >
                            <div>
                              <div className="flex justify-between items-center mb-4">
                                <span className="text-lg font-bold text-[#0f172a]">{item.monthYear.split(' ')[0]}</span>
                                {item.isCurrent && (
                                  <span className="bg-[#6366f1] text-white text-[9px] font-bold uppercase px-2 py-0.5 rounded-full tracking-wider">
                                    Mês Atual
                                  </span>
                                )}
                              </div>

                              <div className="space-y-3 font-mono text-xs" id="history-card-metrics">
                                <div className="flex justify-between items-baseline">
                                  <span className="text-[#64748b] font-sans font-medium text-[10px] uppercase tracking-wider">Total Despesas</span>
                                  <span className="text-sm font-bold text-[#ef4444]">{fmt(item.totalExpenses)}</span>
                                </div>
                                <div className="flex justify-between items-baseline">
                                  <span className="text-[#64748b] font-sans font-medium text-[10px] uppercase tracking-wider">Total Investimentos</span>
                                  <span className="text-sm font-bold text-[#166534]">{fmt(item.totalInvestments)}</span>
                                </div>
                              </div>
                            </div>

                            <div className="border-t border-[#f1f3f9] pt-4 mt-5 flex justify-end">
                              <button 
                                onClick={() => {
                                  // Switch active month to this month
                                  if (typeof window !== 'undefined') {
                                    const allMonthsStr = localStorage.getItem('finflow_months_data');
                                    if (allMonthsStr) {
                                      try {
                                        const allMonths = JSON.parse(allMonthsStr);
                                        if (allMonths[item.monthYear]) {
                                          setActiveMonthData(allMonths[item.monthYear]);
                                          localStorage.setItem('finflow_active_month', JSON.stringify(allMonths[item.monthYear]));
                                        } else {
                                          // Create a default one if not found in months_data
                                          const newMonthObj: MonthlyData = {
                                            monthYear: item.monthYear,
                                            lastUpdated: new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' }) + ' às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                                            investments: [],
                                            expenses: [],
                                            splitRatioLudmila: 60,
                                            people: {
                                              ludmila: { name: "Ludmilla", budgetLimit: 1400, personalExpenses: [] },
                                              leine: { name: "Leinimer", budgetLimit: 1400, personalExpenses: [] }
                                            }
                                          };
                                          setActiveMonthData(newMonthObj);
                                          localStorage.setItem('finflow_active_month', JSON.stringify(newMonthObj));
                                          
                                          allMonths[item.monthYear] = newMonthObj;
                                          localStorage.setItem('finflow_months_data', JSON.stringify(allMonths));
                                        }
                                      } catch (e) {
                                        console.error(e);
                                      }
                                    }
                                  }
                                  // Sync other months' isCurrent
                                  const updatedHistory = historyMonths.map(h => ({
                                    ...h,
                                    isCurrent: h.monthYear === item.monthYear
                                  }));
                                  setHistoryMonths(updatedHistory);
                                  localStorage.setItem('finflow_history', JSON.stringify(updatedHistory));

                                  setActiveTab('dashboard');
                                  triggerToast(`Carregado dados de ${item.monthYear}`);
                                }}
                                className="text-xs text-[#6366f1] hover:text-[#4f46e5] font-semibold flex items-center gap-1.5 transition-colors"
                              >
                                <span>Ver Dashboard</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}

                {/* Year 2024 Node */}
                <div className="relative" id="timeline-node-2024">
                  <div className="absolute -left-[31px] md:-left-[47px] top-1.5 w-4 h-4 rounded-full bg-white border-2 border-[#e2e8f0] z-10" />
                  <span className="text-sm font-bold text-[#64748b] tracking-wider uppercase font-mono">2024</span>

                  {/* 2024 History list */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6" id="months-list-2024">
                    
                    {/* March 2024 (as shown in image 1) */}
                    <div className="bg-white rounded-xl border border-[#e2e8f0] p-6 flex flex-col justify-between transition-all hover:shadow-lg" id="history-card-m2024">
                      <div>
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-lg font-bold text-[#0f172a]">Março</span>
                        </div>

                        <div className="space-y-3 font-mono text-xs">
                          <div className="flex justify-between items-baseline">
                            <span className="text-[#64748b] font-sans font-medium text-[10px] uppercase tracking-wider">Total Despesas</span>
                            <span className="text-sm font-bold text-[#ef4444]">{fmt(4280)}</span>
                          </div>
                          <div className="flex justify-between items-baseline">
                            <span className="text-[#64748b] font-sans font-medium text-[10px] uppercase tracking-wider">Total Investimentos</span>
                            <span className="text-sm font-bold text-[#166534]">{fmt(12450)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-[#f1f3f9] pt-4 mt-5 flex justify-end">
                        <button 
                          onClick={() => {
                            setSelectedAnalysisMonth("Março 2024");
                            setActiveTab('analyses');
                            triggerToast("Visualizando Análises de Março 2024");
                          }}
                          className="text-xs text-[#6366f1] hover:text-[#4f46e5] font-semibold flex items-center gap-1.5 transition-colors"
                        >
                          <span>Ver Análises</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Dezembro 2024 */}
                    <div className="bg-white rounded-xl border border-[#e2e8f0] p-6 flex flex-col justify-between transition-all hover:shadow-lg" id="history-card-d2024">
                      <div>
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-lg font-bold text-[#0f172a]">Dezembro</span>
                        </div>

                        <div className="space-y-3 font-mono text-xs">
                          <div className="flex justify-between items-baseline">
                            <span className="text-[#64748b] font-sans font-medium text-[10px] uppercase tracking-wider">Total Despesas</span>
                            <span className="text-sm font-bold text-[#ef4444]">{fmt(5100)}</span>
                          </div>
                          <div className="flex justify-between items-baseline">
                            <span className="text-[#64748b] font-sans font-medium text-[10px] uppercase tracking-wider">Total Investimentos</span>
                            <span className="text-sm font-bold text-[#166534]">{fmt(9800)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-[#f1f3f9] pt-4 mt-5 flex justify-end">
                        <span className="text-xs text-[#64748b] font-medium">Consolidado</span>
                      </div>
                    </div>

                  </div>
                </div>

              </div>

              {/* Encouragement message banner */}
              <div className="bg-[#f1f5f9] text-center py-10 space-y-2 rounded-2xl border border-dashed border-[#e2e8f0]" id="history-encouragement">
                <p className="text-base font-medium text-[#6366f1]">
                  Seu progresso é visível
                </p>
                <p className="text-sm text-[#64748b]">
                  Continue construindo seu futuro, um mês de cada vez.
                </p>
              </div>

            </motion.div>
          )}

          {/* ==============================================
              TAB 4: SETTINGS (Ajustes / Configurações)
              ============================================== */}
          {activeTab === 'settings' && (
            <motion.div
              key="settings-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="max-w-2xl mx-auto space-y-8"
              id="settings-screen"
            >
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-[#0f172a] mb-2 font-sans">
                  Configurações do App
                </h1>
                <p className="text-sm text-[#64748b]">
                  Personalize os parâmetros de limites, nomes dos membros da família e restaure as configurações de fábrica.
                </p>
              </div>

              <div className="bg-white rounded-xl border border-[#e2e8f0] p-6 shadow-xs space-y-6" id="settings-card">
                
                {/* Limits and names editors */}
                <h3 className="text-base font-bold text-[#0f172a] uppercase tracking-wider border-b border-[#f1f3f9] pb-3">
                  Parâmetros de Família
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="settings-fields-family">
                  {/* Participant 1 name */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-[#64748b] uppercase">Membro 1 - Nome</label>
                    <input 
                      type="text" 
                      value={activeMonthData.people.ludmila.name}
                      onChange={(e) => {
                        const updated = {
                          ...activeMonthData,
                          people: {
                            ...activeMonthData.people,
                            ludmila: { ...activeMonthData.people.ludmila, name: e.target.value }
                          }
                        };
                        setActiveMonthData(updated);
                        localStorage.setItem('finflow_active_month', JSON.stringify(updated));
                      }}
                      className="w-full bg-white border border-[#e2e8f0] text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#6366f1]"
                    />
                  </div>

                  {/* Participant 1 limit */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-[#64748b] uppercase">Membro 1 - Limite de Orçamento</label>
                    <input 
                      type="number" 
                      value={activeMonthData.people.ludmila.budgetLimit}
                      onChange={(e) => {
                        const updated = {
                          ...activeMonthData,
                          people: {
                            ...activeMonthData.people,
                            ludmila: { ...activeMonthData.people.ludmila, budgetLimit: parseFloat(e.target.value) || 0 }
                          }
                        };
                        setActiveMonthData(updated);
                        localStorage.setItem('finflow_active_month', JSON.stringify(updated));
                      }}
                      className="w-full bg-white border border-[#e2e8f0] text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#6366f1] font-mono"
                    />
                  </div>

                  {/* Participant 2 name */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-[#64748b] uppercase">Membro 2 - Nome</label>
                    <input 
                      type="text" 
                      value={activeMonthData.people.leine.name}
                      onChange={(e) => {
                        const updated = {
                          ...activeMonthData,
                          people: {
                            ...activeMonthData.people,
                            leine: { ...activeMonthData.people.leine, name: e.target.value }
                          }
                        };
                        setActiveMonthData(updated);
                        localStorage.setItem('finflow_active_month', JSON.stringify(updated));
                      }}
                      className="w-full bg-white border border-[#e2e8f0] text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#6366f1]"
                    />
                  </div>

                  {/* Participant 2 limit */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-[#64748b] uppercase">Membro 2 - Limite de Orçamento</label>
                    <input 
                      type="number" 
                      value={activeMonthData.people.leine.budgetLimit}
                      onChange={(e) => {
                        const updated = {
                          ...activeMonthData,
                          people: {
                            ...activeMonthData.people,
                            leine: { ...activeMonthData.people.leine, budgetLimit: parseFloat(e.target.value) || 0 }
                          }
                        };
                        setActiveMonthData(updated);
                        localStorage.setItem('finflow_active_month', JSON.stringify(updated));
                      }}
                      className="w-full bg-white border border-[#e2e8f0] text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#6366f1] font-mono"
                    />
                  </div>
                </div>

                <div className="border-t border-[#f1f3f9] pt-6 flex justify-between items-center" id="settings-danger-zone">
                  <div>
                    <h4 className="text-sm font-semibold text-[#0f172a]">Ações do Sistema</h4>
                    <p className="text-xs text-[#64748b]">Restaure os dados de exemplo do aplicativo ou apague todo histórico.</p>
                  </div>
                  <button 
                    onClick={resetToDefault}
                    className="bg-[#ffdad6]/60 hover:bg-[#ffdad6] text-[#ef4444] px-4 py-2 rounded-lg text-xs font-semibold transition-colors"
                  >
                    Resetar Aplicativo
                  </button>
                </div>

              </div>

              {/* Informational Tip card */}
              <div className="bg-[#e0e7ff] border border-[#6366f1]/15 rounded-xl p-5 flex gap-3 text-xs text-[#64748b]" id="settings-tip">
                <Sparkles className="w-5 h-5 text-[#6366f1] flex-shrink-0" />
                <div className="space-y-1">
                  <p className="font-semibold text-[#6366f1]">Estilo Serene Ledger ativado</p>
                  <p>O aplicativo foi construído seguindo diretrizes estéticas minimalistas com layouts fluidos, tipografia Inter e cores tonais suaves para trazer clareza à gestão familiar.</p>
                </div>
              </div>

            </motion.div>
          )}

        </AnimatePresence>

      </main>

      {/* --- FOOTER --- */}
      <footer className="bg-white border-t border-[#e2e8f0] py-12 text-xs text-[#64748b] mt-16" id="main-footer">
        <div className="max-w-7xl mx-auto px-4 md:px-12 flex flex-col md:flex-row items-center justify-between gap-6">
          
          <div className="text-center md:text-left space-y-1.5" id="footer-copyright-block">
            <div className="flex items-center justify-center md:justify-start gap-1">
              <span className="text-[#0f172a] font-bold tracking-tight text-sm">FinFlow</span>
              <div className="w-1.5 h-1.5 rounded-full bg-[#6366f1]" />
            </div>
            <p>© 2026 FinFlow Gestão Pessoal. Todos os direitos reservados.</p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2" id="footer-links">
            <button onClick={() => triggerToast("Política de Privacidade")} className="hover:text-[#6366f1] transition-colors">Política de Privacidade</button>
            <button onClick={() => triggerToast("Termos de Serviço")} className="hover:text-[#6366f1] transition-colors">Termos de Serviço</button>
            <button onClick={() => triggerToast("Central de Ajuda")} className="hover:text-[#6366f1] transition-colors">Central de Ajuda</button>
            <button onClick={() => triggerToast("Contato")} className="hover:text-[#6366f1] transition-colors">Contato</button>
          </div>

        </div>
      </footer>

      {/* ==============================================
          MODALS & POPUPS
          ============================================== */}
      
      {/* 1. Modal: Add Investment */}
      {showAddInvModal && (
        <div className="fixed inset-0 bg-[#0f172a]/40 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="modal-add-investment">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-2xl border border-[#e2e8f0] max-w-md w-full overflow-hidden"
          >
            <div className="bg-[#f1f5f9] px-6 py-4 border-b border-[#e2e8f0] flex justify-between items-center">
              <h3 className="font-bold text-[#0f172a] text-base">Novo Investimento</h3>
              <button onClick={() => setShowAddInvModal(false)} className="text-[#64748b] hover:text-[#0f172a] text-lg font-bold">×</button>
            </div>
            
            <form onSubmit={handleAddInvestment} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#64748b]">Nome do Ativo</label>
                <input 
                  type="text" 
                  placeholder="Ex: Tesouro Selic, Bitcoin, Nubank" 
                  value={newInv.name}
                  onChange={(e) => setNewInv({ ...newInv, name: e.target.value })}
                  className="w-full bg-white border border-[#e2e8f0] text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#6366f1]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#64748b]">Saldo Atual (R$)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    placeholder="Ex: 5000.00" 
                    value={newInv.saldo}
                    onChange={(e) => setNewInv({ ...newInv, saldo: e.target.value })}
                    className="w-full bg-white border border-[#e2e8f0] text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#6366f1] font-mono"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#64748b]">Aporte do Mês (R$)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    placeholder="Ex: 200.00" 
                    value={newInv.aporte}
                    onChange={(e) => setNewInv({ ...newInv, aporte: e.target.value })}
                    className="w-full bg-white border border-[#e2e8f0] text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#6366f1] font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#64748b]">Variação (%)</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    placeholder="Ex: 1.2 ou -2.4" 
                    value={newInv.variation}
                    onChange={(e) => setNewInv({ ...newInv, variation: e.target.value })}
                    className="w-full bg-white border border-[#e2e8f0] text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#6366f1] font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#64748b]">Instituição</label>
                  <input 
                    type="text" 
                    placeholder="Ex: XP, Nubank" 
                    value={newInv.institution}
                    onChange={(e) => setNewInv({ ...newInv, institution: e.target.value })}
                    className="w-full bg-white border border-[#e2e8f0] text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#6366f1]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#64748b]">Observações</label>
                <input 
                  type="text" 
                  placeholder="Ex: Reserva imediata" 
                  value={newInv.notes}
                  onChange={(e) => setNewInv({ ...newInv, notes: e.target.value })}
                  className="w-full bg-white border border-[#e2e8f0] text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#6366f1]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#f1f3f9]">
                <button 
                  type="button" 
                  onClick={() => setShowAddInvModal(false)}
                  className="px-4 py-2 border border-[#e2e8f0] rounded-lg text-xs font-semibold hover:bg-[#f1f5f9]"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-[#166534] hover:bg-[#14532d] text-white rounded-lg text-xs font-semibold"
                >
                  Salvar
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* 1.1 Modal: Edit Investment */}
      {editingInv && (
        <div className="fixed inset-0 bg-[#0f172a]/40 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="modal-edit-investment">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-2xl border border-[#e2e8f0] max-w-md w-full overflow-hidden"
          >
            <div className="bg-[#f1f5f9] px-6 py-4 border-b border-[#e2e8f0] flex justify-between items-center">
              <h3 className="font-bold text-[#0f172a] text-base">Editar Investimento</h3>
              <button onClick={() => setEditingInv(null)} className="text-[#64748b] hover:text-[#0f172a] text-lg font-bold">×</button>
            </div>
            
            <form onSubmit={handleUpdateInvestment} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#64748b]">Nome do Ativo</label>
                <input 
                  type="text" 
                  placeholder="Ex: Tesouro Selic, Bitcoin, Nubank" 
                  value={editingInv.name ?? ''}
                  onChange={(e) => setEditingInv({ ...editingInv, name: e.target.value })}
                  className="w-full bg-white border border-[#e2e8f0] text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#6366f1]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#64748b]">Saldo Atual (R$)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    placeholder="Ex: 5000.00" 
                    value={editingInv.saldo ?? ''}
                    onChange={(e) => setEditingInv({ ...editingInv, saldo: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-white border border-[#e2e8f0] text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#6366f1] font-mono"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#64748b]">Aporte do Mês (R$)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    placeholder="Ex: 200.00" 
                    value={editingInv.aporte ?? ''}
                    onChange={(e) => setEditingInv({ ...editingInv, aporte: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-white border border-[#e2e8f0] text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#6366f1] font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#64748b]">Variação (%)</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    placeholder="Ex: 1.2 ou -2.4" 
                    value={editingInv.variation ?? ''}
                    onChange={(e) => setEditingInv({ ...editingInv, variation: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-white border border-[#e2e8f0] text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#6366f1] font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#64748b]">Instituição</label>
                  <input 
                    type="text" 
                    placeholder="Ex: XP, Nubank" 
                    value={editingInv.institution ?? ''}
                    onChange={(e) => setEditingInv({ ...editingInv, institution: e.target.value })}
                    className="w-full bg-white border border-[#e2e8f0] text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#6366f1]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#64748b]">Observações</label>
                <input 
                  type="text" 
                  placeholder="Ex: Reserva imediata" 
                  value={editingInv.notes ?? ''}
                  onChange={(e) => setEditingInv({ ...editingInv, notes: e.target.value })}
                  className="w-full bg-white border border-[#e2e8f0] text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#6366f1]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#f1f3f9]">
                <button 
                  type="button" 
                  onClick={() => setEditingInv(null)}
                  className="px-4 py-2 border border-[#e2e8f0] rounded-lg text-xs font-semibold hover:bg-[#f1f5f9]"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-[#166534] hover:bg-[#14532d] text-white rounded-lg text-xs font-semibold"
                >
                  Salvar
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* 2. Modal: Add Expense */}
      {showAddExpModal && (
        <div className="fixed inset-0 bg-[#0f172a]/40 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="modal-add-expense">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-2xl border border-[#e2e8f0] max-w-md w-full overflow-hidden"
          >
            <div className="bg-[#f1f5f9] px-6 py-4 border-b border-[#e2e8f0] flex justify-between items-center">
              <h3 className="font-bold text-[#0f172a] text-base">Nova Despesa Compartilhada</h3>
              <button onClick={() => setShowAddExpModal(false)} className="text-[#64748b] hover:text-[#0f172a] text-lg font-bold">×</button>
            </div>
            
            <form onSubmit={handleAddExpense} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#64748b]">Categoria / Descrição</label>
                <input 
                  type="text" 
                  placeholder="Ex: Aluguel, Eletricidade, Supermercado" 
                  value={newExp.category}
                  onChange={(e) => setNewExp({ ...newExp, category: e.target.value })}
                  className="w-full bg-white border border-[#e2e8f0] text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#6366f1]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#64748b]">Valor (R$)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    placeholder="Ex: 1500.00" 
                    value={newExp.value}
                    onChange={(e) => setNewExp({ ...newExp, value: e.target.value })}
                    className="w-full bg-white border border-[#e2e8f0] text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#6366f1] font-mono"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#64748b]">Parcelas</label>
                  <input 
                    type="text" 
                    placeholder="Ex: 1/1, 3/12" 
                    value={newExp.installments}
                    onChange={(e) => setNewExp({ ...newExp, installments: e.target.value })}
                    className="w-full bg-white border border-[#e2e8f0] text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#6366f1] font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#64748b]">Observações</label>
                <input 
                  type="text" 
                  placeholder="Ex: Vence dia 10" 
                  value={newExp.notes}
                  onChange={(e) => setNewExp({ ...newExp, notes: e.target.value })}
                  className="w-full bg-white border border-[#e2e8f0] text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#6366f1]"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input 
                  type="checkbox" 
                  id="newExpIsRecurring"
                  checked={newExp.isRecurring || false}
                  onChange={(e) => setNewExp({ ...newExp, isRecurring: e.target.checked })}
                  className="rounded text-[#6366f1] focus:ring-[#6366f1] h-4 w-4"
                />
                <label htmlFor="newExpIsRecurring" className="text-xs font-medium text-slate-700 flex items-center gap-1.5 cursor-pointer">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>Despesa fixa / recorrente (se repete nos meses subsequentes)</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#f1f3f9]">
                <button 
                  type="button" 
                  onClick={() => setShowAddExpModal(false)}
                  className="px-4 py-2 border border-[#e2e8f0] rounded-lg text-xs font-semibold hover:bg-[#f1f5f9]"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-[#6366f1] hover:bg-[#4f46e5] text-white rounded-lg text-xs font-semibold"
                >
                  Salvar
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* 3. Modal: Add Personal Expense */}
      {showAddPersonalModal.show && (
        <div className="fixed inset-0 bg-[#0f172a]/40 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="modal-add-personal-expense">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-2xl border border-[#e2e8f0] max-w-md w-full overflow-hidden"
          >
            <div className="bg-[#f1f5f9] px-6 py-4 border-b border-[#e2e8f0] flex justify-between items-center">
              <h3 className="font-bold text-[#0f172a] text-base">Novo Gasto Pessoal de {activeMonthData.people[showAddPersonalModal.person].name}</h3>
              <button onClick={() => setShowAddPersonalModal({ show: false, person: 'ludmila' })} className="text-[#64748b] hover:text-[#0f172a] text-lg font-bold">×</button>
            </div>
            
            <form onSubmit={handleAddPersonalExpense} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#64748b]">Descrição</label>
                <input 
                  type="text" 
                  placeholder="Ex: Academia, Salão de Beleza, Livros" 
                  value={newPersonalExp.description}
                  onChange={(e) => setNewPersonalExp({ ...newPersonalExp, description: e.target.value })}
                  className="w-full bg-white border border-[#e2e8f0] text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#6366f1]"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#64748b]">Valor (R$)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    placeholder="Ex: 150.00" 
                    value={newPersonalExp.value}
                    onChange={(e) => setNewPersonalExp({ ...newPersonalExp, value: e.target.value })}
                    className="w-full bg-white border border-[#e2e8f0] text-sm rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-[#6366f1] font-mono"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#64748b]">Parcela</label>
                  <input 
                    type="text" 
                    placeholder="Ex: 1/1" 
                    value={newPersonalExp.installments}
                    onChange={(e) => setNewPersonalExp({ ...newPersonalExp, installments: e.target.value })}
                    className="w-full bg-white border border-[#e2e8f0] text-sm rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-[#6366f1] font-mono text-center"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#64748b]">Observações</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Salão, Academia" 
                    value={newPersonalExp.notes}
                    onChange={(e) => setNewPersonalExp({ ...newPersonalExp, notes: e.target.value })}
                    className="w-full bg-white border border-[#e2e8f0] text-sm rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-[#6366f1]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#f1f3f9]">
                <button 
                  type="button" 
                  onClick={() => setShowAddPersonalModal({ show: false, person: 'ludmila' })}
                  className="px-4 py-2 border border-[#e2e8f0] rounded-lg text-xs font-semibold hover:bg-[#f1f5f9]"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-[#6366f1] hover:bg-[#4f46e5] text-white rounded-lg text-xs font-semibold"
                >
                  Salvar
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* 4. Modal: Edit Expense */}
      {editingExp && (
        <div className="fixed inset-0 bg-[#0f172a]/40 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="modal-edit-expense">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-2xl border border-[#e2e8f0] max-w-md w-full overflow-hidden"
          >
            <div className="bg-[#f1f5f9] px-6 py-4 border-b border-[#e2e8f0] flex justify-between items-center">
              <h3 className="font-bold text-[#0f172a] text-base">Editar Despesa Compartilhada</h3>
              <button onClick={() => setEditingExp(null)} className="text-[#64748b] hover:text-[#0f172a] text-lg font-bold">×</button>
            </div>
            
            <form onSubmit={handleUpdateExpense} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#64748b]">Categoria / Descrição</label>
                <input 
                  type="text" 
                  value={editingExp.category ?? ''}
                  onChange={(e) => setEditingExp({ ...editingExp, category: e.target.value })}
                  className="w-full bg-white border border-[#e2e8f0] text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#6366f1]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#64748b]">Valor (R$)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={editingExp.value ?? ''}
                    onChange={(e) => setEditingExp({ ...editingExp, value: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-white border border-[#e2e8f0] text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#6366f1] font-mono"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#64748b]">Parcelas</label>
                  <input 
                    type="text" 
                    value={editingExp.installments ?? ''}
                    onChange={(e) => setEditingExp({ ...editingExp, installments: e.target.value })}
                    className="w-full bg-white border border-[#e2e8f0] text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#6366f1] font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#64748b]">Observações</label>
                <input 
                  type="text" 
                  value={editingExp.notes ?? ''}
                  onChange={(e) => setEditingExp({ ...editingExp, notes: e.target.value })}
                  className="w-full bg-white border border-[#e2e8f0] text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#6366f1]"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input 
                  type="checkbox" 
                  id="editExpIsRecurring"
                  checked={editingExp.isRecurring || false}
                  onChange={(e) => setEditingExp({ ...editingExp, isRecurring: e.target.checked })}
                  className="rounded text-[#6366f1] focus:ring-[#6366f1] h-4 w-4"
                />
                <label htmlFor="editExpIsRecurring" className="text-xs font-medium text-slate-700 flex items-center gap-1.5 cursor-pointer">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>Despesa fixa / recorrente (se repete nos meses subsequentes)</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#f1f3f9]">
                <button 
                  type="button" 
                  onClick={() => setEditingExp(null)}
                  className="px-4 py-2 border border-[#e2e8f0] rounded-lg text-xs font-semibold hover:bg-[#f1f5f9]"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-[#6366f1] hover:bg-[#4f46e5] text-white rounded-lg text-xs font-semibold"
                >
                  Salvar
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* 5. Modal: Edit Personal Expense */}
      {editingPersonalExp && (
        <div className="fixed inset-0 bg-[#0f172a]/40 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="modal-edit-personal-expense">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-2xl border border-[#e2e8f0] max-w-md w-full overflow-hidden"
          >
            <div className="bg-[#f1f5f9] px-6 py-4 border-b border-[#e2e8f0] flex justify-between items-center">
              <h3 className="font-bold text-[#0f172a] text-base">Editar Gasto Pessoal de {activeMonthData.people[editingPersonalExp.person].name}</h3>
              <button onClick={() => setEditingPersonalExp(null)} className="text-[#64748b] hover:text-[#0f172a] text-lg font-bold">×</button>
            </div>
            
            <form onSubmit={handleUpdatePersonalExpense} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#64748b]">Descrição</label>
                <input 
                  type="text" 
                  value={editingPersonalExp.expense.description ?? ''}
                  onChange={(e) => setEditingPersonalExp({
                    ...editingPersonalExp,
                    expense: { ...editingPersonalExp.expense, description: e.target.value }
                  })}
                  className="w-full bg-white border border-[#e2e8f0] text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#6366f1]"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#64748b]">Valor (R$)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={editingPersonalExp.expense.value ?? ''}
                    onChange={(e) => setEditingPersonalExp({
                      ...editingPersonalExp,
                      expense: { ...editingPersonalExp.expense, value: parseFloat(e.target.value) || 0 }
                    })}
                    className="w-full bg-white border border-[#e2e8f0] text-sm rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-[#6366f1] font-mono"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#64748b]">Parcela</label>
                  <input 
                    type="text" 
                    value={editingPersonalExp.expense.installments ?? '1/1'}
                    onChange={(e) => setEditingPersonalExp({
                      ...editingPersonalExp,
                      expense: { ...editingPersonalExp.expense, installments: e.target.value }
                    })}
                    className="w-full bg-white border border-[#e2e8f0] text-sm rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-[#6366f1] font-mono text-center"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#64748b]">Observações</label>
                  <input 
                    type="text" 
                    value={editingPersonalExp.expense.notes ?? ''}
                    onChange={(e) => setEditingPersonalExp({
                      ...editingPersonalExp,
                      expense: { ...editingPersonalExp.expense, notes: e.target.value }
                    })}
                    className="w-full bg-white border border-[#e2e8f0] text-sm rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-[#6366f1]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#f1f3f9]">
                <button 
                  type="button" 
                  onClick={() => setEditingPersonalExp(null)}
                  className="px-4 py-2 border border-[#e2e8f0] rounded-lg text-xs font-semibold hover:bg-[#f1f5f9]"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-[#6366f1] hover:bg-[#4f46e5] text-white rounded-lg text-xs font-semibold"
                >
                  Salvar
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
}
