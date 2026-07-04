'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { DepartmentData, ProvinceData, DistrictData } from '@/types';
import styles from './LocationSelector.module.css';

interface LocationSelectorProps {
  step: 'department' | 'province' | 'district';
  departmentId?: string;
  provinceId?: string;
  onSelectDepartment: (dept: DepartmentData) => void;
  onSelectProvince: (prov: ProvinceData) => void;
  onSelectDistrict: (dist: DistrictData) => void;
}

export default function LocationSelector({
  step,
  departmentId,
  provinceId,
  onSelectDepartment,
  onSelectProvince,
  onSelectDistrict,
}: LocationSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSearchQuery('');
    setLoading(true);

    const fetchItems = async () => {
      try {
        let url = '/api/locations?type=departments';
        if (step === 'province' && departmentId) {
          url = `/api/locations?type=provinces&departmentId=${departmentId}`;
        } else if (step === 'district' && provinceId) {
          url = `/api/locations?type=districts&provinceId=${provinceId}`;
        }

        const res = await fetch(url);
        const data = await res.json();
        setItems(data.items || []);
      } catch (error) {
        console.error('Error fetching locations:', error);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [step, departmentId, provinceId]);

  const normalizeString = (str: string) => {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove accents/diacritics
      .trim();
  };

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = normalizeString(searchQuery);
    return items.filter((item) => normalizeString(item.name).includes(q));
  }, [items, searchQuery]);

  const handleSelect = (item: { id: string; name: string }) => {
    if (step === 'department') {
      onSelectDepartment(item as any);
    } else if (step === 'province') {
      onSelectProvince(item as any);
    } else {
      onSelectDistrict(item as any);
    }
  };

  const stepLabels = {
    department: '📍 Selecciona tu departamento',
    province: '📍 Selecciona tu provincia',
    district: '📍 Selecciona tu distrito',
  };

  return (
    <motion.div
      className={styles.container}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3 }}
    >
      <div className={styles.header}>
        <h3 className={styles.title}>{stepLabels[step]}</h3>
        <div className={styles.stepIndicator}>
          <div className={`${styles.stepDot} ${step === 'department' || step === 'province' || step === 'district' ? styles.stepActive : ''}`} />
          <div className={styles.stepLine} />
          <div className={`${styles.stepDot} ${step === 'province' || step === 'district' ? styles.stepActive : ''}`} />
          <div className={styles.stepLine} />
          <div className={`${styles.stepDot} ${step === 'district' ? styles.stepActive : ''}`} />
        </div>
      </div>

      <div className={styles.searchContainer}>
        <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <input
          type="text"
          className={styles.searchInput}
          placeholder={`Buscar ${step === 'department' ? 'departamento' : step === 'province' ? 'provincia' : 'distrito'}...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          id="location-search-input"
        />
      </div>

      <div className={styles.list}>
        {loading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner} />
            <p>Cargando...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No se encontraron resultados</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item, i) => (
              <motion.button
                key={item.id}
                className={styles.listItem}
                onClick={() => handleSelect(item)}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ delay: Math.min(i * 0.02, 0.3) }}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className={styles.itemName}>{item.name}</span>
                <svg className={styles.itemArrow} width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </motion.button>
            ))}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
}
