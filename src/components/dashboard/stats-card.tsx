'use client';

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatsCardProps {
    title: string;
    value: string | number;
    description?: string;
    icon: LucideIcon;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    color?: string;
}

export function StatsCard({
    title,
    value,
    description,
    icon: Icon,
    trend,
    color = 'bg-primary',
}: StatsCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <Card className="hover:shadow-lg transition-shadow duration-200">
                <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">{title}</p>
                            <p className="text-3xl font-bold">{value}</p>
                            {description && (
                                <p className="text-xs text-muted-foreground">{description}</p>
                            )}
                            {trend && (
                                <div
                                    className={cn(
                                        'inline-flex items-center text-xs font-medium',
                                        trend.isPositive ? 'text-success' : 'text-destructive'
                                    )}
                                >
                                    {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
                                    <span className="ml-1 text-muted-foreground">vs last week</span>
                                </div>
                            )}
                        </div>
                        <div
                            className={cn(
                                'p-3 rounded-xl',
                                color
                            )}
                        >
                            <Icon className="w-5 h-5 text-primary-foreground" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
