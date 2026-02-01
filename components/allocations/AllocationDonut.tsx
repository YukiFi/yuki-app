'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface AllocationData {
    name: string;
    value: number;
    usdValue: number;
    color: string;
}

interface AllocationDonutProps {
    data: AllocationData[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[#0b0b0f]/90 border border-white/10 backdrop-blur-xl p-3 rounded-xl shadow-xl">
                <p className="font-medium text-white">{payload[0].name}</p>
                <p className="text-sm text-white/70">
                    ${payload[0].value?.toLocaleString()}
                </p>
            </div>
        );
    }
    return null;
};

export function AllocationDonut({ data }: AllocationDonutProps) {
    return (
        <div className="h-[300px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                    >
                        {data.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={entry.color}
                                className="stroke-transparent outline-none"
                            />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                </PieChart>
            </ResponsiveContainer>

            {/* Center Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-white/50 text-xs font-medium uppercase tracking-wider">Total</span>
                <span className="text-2xl font-bold text-white tracking-tight">
                    ${data.reduce((acc, curr) => acc + curr.value, 0).toLocaleString()}
                </span>
            </div>
        </div>
    );
}
