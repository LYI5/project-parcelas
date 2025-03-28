import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '../prisma.service';

@Injectable()
export class SensoresService implements OnModuleInit {
    private readonly logger = new Logger(SensoresService.name);

    constructor(private readonly prisma: PrismaService) { }

    async actualizarSensores() {
        try {
            // Consulta de la API externa
            const response = await axios.get('https://moriahmkt.com/iotapp/test/');
            const data = response.data;

            // guardar datos generales en la tabla SensoresGenerales si ta diferente
            const ultimoSensorGeneral = await this.prisma.sensoresGenerales.findFirst({
                orderBy: { fechaHora: 'desc' },
            });
            
            // Verificar si hay cambios en los datos generales
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
            // Obtiene los IDs actuales de la API para comparar después con la bd
            const apiParcelasIds = data.parcelas.map(p => p.id);

            for (const parcelaData of data.parcelas) {
                // Verificar si la parcela existe en la tabla Parcelas (por idParcela)
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
                    // Si la parcela ya existe, actualizar su información general
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

                    //  Comparar los datos actuales de sensores con el último registro en sensores_parcelas
                    const ultimoRegistroSensor = await this.prisma.sensoresParcelas.findFirst({
                        where: { parcelaId: parcelaExistente.id },
                        orderBy: { fechaHora: 'desc' },
                    });

                    // Si no hay registro previo o si alguno de los valores difiere, insertar un nuevo histórico
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

            // Iterar sobre las parcelas registradas para detectar las que ya no aparecen en la API
            for (const parcela of parcelasRegistradas) {
                if (!apiParcelasIds.includes(parcela.idParcela)) {
                    // Mover la parcela a la tabla parcelas_eliminadas
                    await this.prisma.parcelasEliminadas.create({
                        data: {
                            nombre: parcela.nombre,
                            ubicacion: parcela.ubicacion,
                            responsable: parcela.responsable,
                            tipoCultivo: parcela.tipoCultivo,
                            ultimoRiego: parcela.ultimoRiego,
                            latitud: parcela.latitud,
                            longitud: parcela.longitud,
                        },
                    });
                    
                    // Primero eliminar todos los registros de sensores asociados a esta parcela
                    await this.prisma.sensoresParcelas.deleteMany({
                        where: { parcelaId: parcela.id },
                    });
                    
                    // Ahora sí podemos eliminar la parcela de la tabla Parcelas
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
        setInterval(() => this.actualizarSensores(), 10 * 60 * 1000); // Cada 10 minutos
    }
}
