'use client';

import { motion } from 'framer-motion';

interface AllocationData {
    name: string;
    value: number;
    percentage: number;
    color: string;
}

interface AllocationListProps {
    data: AllocationData[];
}

export function AllocationList({ data }: AllocationListProps) {
    return (
        <div className="space-y-4">
            {data.map((item, index) => (
                <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5 hover:border-white/10 group cursor-default"
                >
                    <div className="flex items-center gap-3">
                        <div
                            className="w-3 h-3 rounded-full shadow-[0_0_10px_inset]"
                            style={{
                                backgroundColor: item.color,
                                boxShadow: `0 0 12px ${item.color}40`
                            }}
                        />
                        <span className="font-medium text-white/90 group-hover:text-white transition-colors">
                            {item.name}
                        </span>
                    </div>

                    <div className="flex flex-col items-end">
                        <span className="font-bold text-white text-lg tracking-tight">
                            ${item.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span className="text-xs text-white/50 font-medium">
                            {item.percentage}%
                        </span>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
