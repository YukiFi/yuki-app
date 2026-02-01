'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { useBalance } from '@/lib/hooks/useBalance';
import { AllocationDonut } from '@/components/allocations/AllocationDonut';
import { AllocationList } from '@/components/allocations/AllocationList';
import { motion } from 'framer-motion';

export default function AllocationsPage() {
    const { walletAddress } = useAuth();
    const { yUSD, isLoading } = useBalance(walletAddress as `0x${string}`);

    // Mock allocation breakdown
    // In a real app, this would come from an API or contract call
    const totalYUSD = parseFloat(yUSD) || 0;

    const allocationData = [
        { name: 'Core Wallet', value: totalYUSD * 0.4, percentage: 40, color: '#e1a8f0' }, // Brand Primary
        { name: 'Yield Strategy A', value: totalYUSD * 0.35, percentage: 35, color: '#c47de0' }, // Brand Dark
        { name: 'Liquidity Pool', value: totalYUSD * 0.25, percentage: 25, color: '#edc4f5' }, // Brand Light
    ].map(item => ({
        ...item,
        usdValue: item.value // Assuming 1:1 for now
    }));

    return (
        <div className="flex flex-col gap-6 p-6 max-w-4xl mx-auto">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-white">
                    yUSD Allocations
                </h1>
                <p className="text-white/60">
                    Visual breakdown of your yUSD holdings across strategies.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
                {/* Chart Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/5 border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[400px]"
                >
                    {isLoading ? (
                        <div className="animate-pulse flex flex-col items-center">
                            <div className="h-48 w-48 rounded-full bg-white/10 mb-4" />
                            <div className="h-4 w-32 bg-white/10 rounded" />
                        </div>
                    ) : (
                        <AllocationDonut data={allocationData} />
                    )}
                </motion.div>

                {/* List Section */}
                <div className="flex flex-col justify-center">
                    <h2 className="text-xl font-semibold text-white mb-4">
                        Breakdown
                    </h2>
                    {isLoading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-20 w-full bg-white/5 rounded-xl animate-pulse" />
                            ))}
                        </div>
                    ) : (
                        <AllocationList data={allocationData} />
                    )}
                </div>
            </div>
        </div>
    );
}
