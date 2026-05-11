import { NextResponse } from 'next/server';
import { requirePermission, handleAuthError } from '@/services/AuthService';
import { settingsRepository } from '@/repositories/SettingsRepositories';

export async function GET(req: Request) {
  try {
    await requirePermission(req, "view_settings");
    const data = await settingsRepository.getNeuralConfig();
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return handleAuthError(error);
  }
}

export async function POST(req: Request) {
  try {
    await requirePermission(req, "update_settings");
    
    const body = await req.json();
    const { historicalRunway, forecastWindow, weightingMode } = body;

    const newConfig = {
      historicalRunway: Number(historicalRunway) || 120,
      forecastWindow: Number(forecastWindow) || 14,
      weightingMode: weightingMode || 'BALANCED'
    };

    await settingsRepository.updateNeuralConfig(newConfig);

    return NextResponse.json({ success: true, message: "Neural Configuration Synchronized" });
  } catch (error: any) {
    return handleAuthError(error);
  }
}
