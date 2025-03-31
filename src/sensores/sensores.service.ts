import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '../prisma.service';

@Injectable()
export class SensoresService implements OnModuleInit {
    private readonly logger = new Logger(SensoresService.name);

    constructor(private readonly prisma: PrismaService) { }

    async actualizarSensores() {
        try {
            const response = await axios.get('https://moriahmkt.com/iotapp/updated/');
            const data = response.data;

            // guardar los datos generales en la tabla SensoresGenerales si no ta igual
            const ultimoSensorGeneral = await this.prisma.sensoresGenerales.findFirst({
                orderBy: { fechaHora: 'desc' },
            });
            
            // para ver si hay cambios en los datos generales
            if (!ultimoSensorGeneral || 
                ultimoSensorGeneral.humedad !== data.sensores.humedad ||
                ultimoSensorGeneral.temperatura !== data.sensores.temperatura ||
                ultimoSensorGeneral.lluvia !== data.sensores.lluvia ||
                ultimoSensorGeneral.sol !== data.sensores.sol) {
                
                await this.prisma.sensoresGenerales.create({
                    data: {
                        humedad: data.sensores.humedad,
                        temperatura: data.sensores.temperatura,
                        lluvia: data.sensores.lluvia,
                        sol: data.sensores.sol,
                    },
                });
                this.logger.log('Nuevos datos generales insertados.');
            } else {
                this.logger.log('No hay cambios en los datos generales, omitiendo inserción.');
            }

            // Proceso cada parcela de la respuesta
            // jala los IDs actuales de la API para comparar después con la bd
            const apiParcelasIds = data.parcelas.map(p => p.id);

            for (const parcelaData of data.parcelas) {
                // Verificar si la parcela existe en la tabla Parcelas
                const parcelaExistente = await this.prisma.parcelas.findUnique({
                    where: { idParcela: parcelaData.id },
                });

                // Datos del sensor para la parcela
                const sensorData = {
                    humedad: parcelaData.sensor.humedad,
                    temperatura: parcelaData.sensor.temperatura,
                    lluvia: parcelaData.sensor.lluvia,
                    sol: parcelaData.sensor.sol,
                };

                if (parcelaExistente) {
                    // Si la parcela ya existe actualizar su informacion
                    await this.prisma.parcelas.update({
                        where: { idParcela: parcelaData.id },
                        data: {
                            nombre: parcelaData.nombre,
                            ubicacion: parcelaData.ubicacion,
                            responsable: parcelaData.responsable,
                            tipoCultivo: parcelaData.tipo_cultivo,
                            ultimoRiego: new Date(parcelaData.ultimo_riego),
                            latitud: parcelaData.latitud,
                            longitud: parcelaData.longitud,
                        },
                    });
                    this.logger.log(`Parcela ${parcelaData.id} actualizada.`);

                    //  Comparar los datos actuales de sensores con el último registro en sensores generles
                    const ultimoRegistroSensor = await this.prisma.sensoresParcelas.findFirst({
                        where: { parcelaId: parcelaExistente.id },
                        orderBy: { fechaHora: 'desc' },
                    });

                    // insertar un nuevo histórico si hay alguin nuevo o algo cambio
                    if (
                        !ultimoRegistroSensor ||
                        ultimoRegistroSensor.humedad !== sensorData.humedad ||
                        ultimoRegistroSensor.temperatura !== sensorData.temperatura ||
                        ultimoRegistroSensor.lluvia !== sensorData.lluvia ||
                        ultimoRegistroSensor.sol !== sensorData.sol
                    ) {
                        await this.prisma.sensoresParcelas.create({
                            data: {
                                parcelaId: parcelaExistente.id,
                                humedad: sensorData.humedad,
                                temperatura: sensorData.temperatura,
                                lluvia: sensorData.lluvia,
                                sol: sensorData.sol,
                            },
                        });
                        this.logger.log(`Nuevo registro de sensor para la parcela ${parcelaData.id}.`);
                    } else {
                        this.logger.log(`No hay cambios en sensores para la parcela ${parcelaData.id}.`);
                    }
                } else {
                    // Si la parcela no existe, insertar la nueva parcela y su primer registro de sensores
                    const nuevaParcela = await this.prisma.parcelas.create({
                        data: {
                            idParcela: parcelaData.id,
                            nombre: parcelaData.nombre,
                            ubicacion: parcelaData.ubicacion,
                            responsable: parcelaData.responsable,
                            tipoCultivo: parcelaData.tipo_cultivo,
                            ultimoRiego: new Date(parcelaData.ultimo_riego),
                            latitud: parcelaData.latitud,
                            longitud: parcelaData.longitud,
                            humedad: sensorData.humedad,
                            temperatura: sensorData.temperatura,
                            lluvia: sensorData.lluvia,
                            sol: sensorData.sol,
                        },
                    });
                    await this.prisma.sensoresParcelas.create({
                        data: {
                            parcelaId: nuevaParcela.id,
                            humedad: sensorData.humedad,
                            temperatura: sensorData.temperatura,
                            lluvia: sensorData.lluvia,
                            sol: sensorData.sol,
                        },
                    });
                    this.logger.log(`Parcela ${parcelaData.id} insertada y primer registro de sensor creado.`);
                }
            }

            //Parcelas Eliminadas:
            // Obtener todas las parcelas registradas en la BD
            const parcelasRegistradas = await this.prisma.parcelas.findMany();

            for (const parcela of parcelasRegistradas) {
                if (!apiParcelasIds.includes(parcela.idParcela)) {
                    // mover la parcela a la tabla a eliminadas
                    // donde se mueve
                    await this.prisma.parcelasEliminadas.create({
                        data: {
                            idParcela: parcela.idParcela,
                            nombre: parcela.nombre,
                            ubicacion: parcela.ubicacion,
                            responsable: parcela.responsable,
                            tipoCultivo: parcela.tipoCultivo,
                            ultimoRiego: parcela.ultimoRiego,
                            latitud: parcela.latitud,
                            longitud: parcela.longitud,
                        },
                    });
                    
                    // Primero eliminar todos los registros de sensores que se relacionan a esta parcela
                    await this.prisma.sensoresParcelas.deleteMany({
                        where: { parcelaId: parcela.id },
                    });
                    
                    // d ahi se puede eliminar la parcela de la tabla Parcelas
                    await this.prisma.parcelas.delete({
                        where: { id: parcela.id },
                    });
                    this.logger.log(`Parcela ${parcela.idParcela} eliminada (movida a parcelas_eliminadas).`);
                }
            }

            this.logger.log('Actualización de sensores completada.');
        } catch (error) {
            this.logger.error('Error al actualizar sensores:', error);
        }
    }

    
    onModuleInit() {
        this.actualizarSensores();
        setInterval(() => this.actualizarSensores(), 10 * 60 * 1000);
    }
}
