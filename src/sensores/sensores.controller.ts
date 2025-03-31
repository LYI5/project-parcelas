import { Controller, Get, Param, Query } from '@nestjs/common';
import { SensoresService } from './sensores.service';
import { PrismaService } from '../prisma.service';

@Controller('sensores')
export class SensoresController {
    constructor(
        private readonly sensoresService: SensoresService,
        private readonly prisma: PrismaService,
    ) { }

    // Endpoint para obtener el último registro de sensores generales y las parcelas
    @Get()
    async obtenerSensores() {
        const sensores = await this.prisma.sensoresGenerales.findMany({
            orderBy: { fechaHora: 'desc' },
            take: 1,
        });
        const parcelas = await this.prisma.parcelas.findMany();
        return { sensores: sensores[0], parcelas };
    }

    // Nuevo endpoint para obtener datos históricos de una parcela
    @Get('historial/:parcelaId')
    async obtenerHistorialParcela(
        @Param('parcelaId') parcelaId: string,
        @Query('dias') dias: string = '7'
    ) {
        const diasAtras = parseInt(dias);
        const fechaLimite = new Date();
        fechaLimite.setDate(fechaLimite.getDate() - diasAtras);

        const historial = await this.prisma.sensoresParcelas.findMany({
            where: { 
                parcelaId: parseInt(parcelaId),
                fechaHora: {
                    gte: fechaLimite
                }
            },
            orderBy: { fechaHora: 'asc' },
            include: {
                parcela: {
                    select: {
                        nombre: true,
                        ubicacion: true,
                        tipoCultivo: true
                    }
                }
            }
        });
        
        return { historial };
    }

    // Endpoint para obtener datos históricos generales
    @Get('historial-general')
    async obtenerHistorialGeneral(@Query('dias') dias: string = '7') {
        const diasAtras = parseInt(dias);
        const fechaLimite = new Date();
        fechaLimite.setDate(fechaLimite.getDate() - diasAtras);

        const historial = await this.prisma.sensoresGenerales.findMany({
            where: {
                fechaHora: {
                    gte: fechaLimite
                }
            },
            orderBy: { fechaHora: 'asc' }
        });
        
        return { historial };
    }

    // Endpoint para obtener parcelas eliminadas
    @Get('parcelas-eliminadas')
    async obtenerParcelasEliminadas() {
        // Obtener todas las parcelas eliminadas
        const parcelasEliminadas = await this.prisma.parcelasEliminadas.findMany({
            orderBy: { fechaEliminacion: 'desc' }
        });
        
        // Obtener las parcelas activas actuales
        const parcelasActivas = await this.prisma.parcelas.findMany();
        
        // Filtrar para mostrar solo las parcelas que siguen eliminadas
        const parcelasActualmenteEliminadas = parcelasEliminadas.filter(parcela => {
            // Verificar si existe una parcela activa con el mismo idParcela o coordenadas muy similares
            return !parcelasActivas.some(activa => 
                activa.idParcela === parcela.idParcela ||
                (Math.abs(activa.latitud - parcela.latitud) < 0.0001 && 
                 Math.abs(activa.longitud - parcela.longitud) < 0.0001)
            );
        });
        
        return { parcelasEliminadas: parcelasActualmenteEliminadas };
    }
}
